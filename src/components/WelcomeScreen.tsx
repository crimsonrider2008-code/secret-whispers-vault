import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Unlock, Fingerprint, KeyRound, Shield, Hash, Scan, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { 
  isBiometricAvailable, 
  authenticateWithBiometric, 
  isBiometricEnabled,
  enableBiometric 
} from "@/lib/biometric";
import { ForgotPinDialog } from "@/components/ForgotPinDialog";
import { SecurityQuestionDialog } from "@/components/SecurityQuestionDialog";
import { toast } from "sonner";
import { initializeAppTimestamp } from "@/lib/deviceId";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WelcomeScreenProps {
  onUnlock: () => void;
}

type SecurityType = "pin" | "password" | "pattern" | "biometric";

interface SecurityOption {
  value: SecurityType;
  label: string;
  icon: React.ElementType;
  description: string;
  available: boolean;
}

// Pattern lock grid positions
const PATTERN_DOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const WelcomeScreen = ({ onUnlock }: WelcomeScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"create" | "confirm" | "enter">("enter");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);
  
  // Security type
  const [securityType, setSecurityType] = useState<SecurityType>("pin");
  const [storedSecurityType, setStoredSecurityType] = useState<SecurityType | null>(null);
  
  // PIN state
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  // Password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Pattern state
  const [pattern, setPattern] = useState<number[]>([]);
  const [confirmPattern, setConfirmPattern] = useState<number[]>([]);
  const [isDrawingPattern, setIsDrawingPattern] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);

  // Security options
  const securityOptions: SecurityOption[] = [
    { value: "pin", label: "PIN Code", icon: Hash, description: "4-digit numeric code", available: true },
    { value: "password", label: "Password", icon: KeyRound, description: "Text-based password", available: true },
    { value: "pattern", label: "Pattern", icon: Scan, description: "Draw a pattern to unlock", available: true },
    { value: "biometric", label: "Biometric", icon: Fingerprint, description: "Face ID / Touch ID", available: biometricAvailable },
  ];

  useEffect(() => {
    initializeAppTimestamp();
    
    const existingPin = localStorage.getItem("shadowself-pin");
    const existingPassword = localStorage.getItem("shadowself-password");
    const existingPattern = localStorage.getItem("shadowself-pattern");
    const existingSecurityType = localStorage.getItem("shadowself-security-type") as SecurityType | null;
    
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      
      if (available && isBiometricEnabled() && (existingPin || existingPassword || existingPattern)) {
        const success = await authenticateWithBiometric();
        if (success) {
          onUnlock();
          return true;
        }
      }
      return false;
    };
    
    setTimeout(async () => {
      const biometricSuccess = await checkBiometric();
      
      if (!biometricSuccess) {
        setIsLoading(false);
        setTimeout(() => {
          const hasExistingSecurity = existingPin || existingPassword || existingPattern;
          
          if (!hasExistingSecurity) {
            setStep("create");
          } else {
            setStep("enter");
            if (existingSecurityType) {
              setSecurityType(existingSecurityType);
              setStoredSecurityType(existingSecurityType);
            }
          }
        }, 500);
      }
    }, 2000);
  }, [onUnlock]);

  // Focus input when security type changes
  useEffect(() => {
    if ((securityType === "pin" || securityType === "password") && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [securityType, step]);

  const triggerHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  };

  const handleBiometricAuth = async () => {
    await triggerHaptic();
    const success = await authenticateWithBiometric();
    if (success) {
      if (!isBiometricEnabled()) {
        enableBiometric();
        toast.success("Biometric authentication enabled");
      }
      onUnlock();
    } else {
      setError("Biometric authentication failed");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    
    if (step === "confirm") {
      setConfirmPin(value);
      if (value.length === 4) {
        validatePinConfirm(value);
      }
    } else if (step === "create") {
      setPin(value);
      setError("");
    } else {
      setPin(value);
      if (value.length === 4) {
        validatePinEntry(value);
      }
    }
  };

  const validatePinConfirm = (value: string) => {
    if (value === pin) {
      localStorage.setItem("shadowself-pin", pin);
      localStorage.setItem("shadowself-security-type", "pin");
      checkSecurityQuestionAndUnlock();
    } else {
      showError("PINs don't match");
      setTimeout(() => {
        setPin("");
        setConfirmPin("");
        setStep("create");
      }, 1000);
    }
  };

  const validatePinEntry = (value: string) => {
    const storedPin = localStorage.getItem("shadowself-pin");
    if (value === storedPin) {
      offerBiometricAndUnlock();
    } else {
      showError("Incorrect PIN");
      setTimeout(() => setPin(""), 1000);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (step === "confirm") {
      setConfirmPassword(value);
    } else {
      setPassword(value);
      setError("");
    }
  };

  const handlePasswordSubmit = () => {
    if (step === "create") {
      if (password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
      }
      setStep("confirm");
      setConfirmPassword("");
    } else if (step === "confirm") {
      if (confirmPassword === password) {
        localStorage.setItem("shadowself-password", password);
        localStorage.setItem("shadowself-security-type", "password");
        checkSecurityQuestionAndUnlock();
      } else {
        showError("Passwords don't match");
        setTimeout(() => {
          setPassword("");
          setConfirmPassword("");
          setStep("create");
        }, 1000);
      }
    } else {
      const storedPassword = localStorage.getItem("shadowself-password");
      if (password === storedPassword) {
        offerBiometricAndUnlock();
      } else {
        showError("Incorrect password");
        setTimeout(() => setPassword(""), 1000);
      }
    }
  };

  const handlePatternDotClick = (index: number) => {
    triggerHaptic();
    
    const currentPattern = step === "confirm" ? confirmPattern : pattern;
    const setCurrentPattern = step === "confirm" ? setConfirmPattern : setPattern;
    
    if (currentPattern.includes(index)) return;
    
    const newPattern = [...currentPattern, index];
    setCurrentPattern(newPattern);
    setError("");
  };

  const handlePatternComplete = () => {
    const currentPattern = step === "confirm" ? confirmPattern : pattern;
    
    if (currentPattern.length < 4) {
      showError("Connect at least 4 dots");
      return;
    }
    
    if (step === "create") {
      setStep("confirm");
      setConfirmPattern([]);
    } else if (step === "confirm") {
      if (JSON.stringify(confirmPattern) === JSON.stringify(pattern)) {
        localStorage.setItem("shadowself-pattern", JSON.stringify(pattern));
        localStorage.setItem("shadowself-security-type", "pattern");
        checkSecurityQuestionAndUnlock();
      } else {
        showError("Patterns don't match");
        setTimeout(() => {
          setPattern([]);
          setConfirmPattern([]);
          setStep("create");
        }, 1000);
      }
    } else {
      const storedPattern = localStorage.getItem("shadowself-pattern");
      if (JSON.stringify(currentPattern) === storedPattern) {
        offerBiometricAndUnlock();
      } else {
        showError("Incorrect pattern");
        setTimeout(() => setPattern([]), 1000);
      }
    }
  };

  const clearPattern = () => {
    if (step === "confirm") {
      setConfirmPattern([]);
    } else {
      setPattern([]);
    }
  };

  const showError = (message: string) => {
    setError(message);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setError("");
    }, 1000);
  };

  const checkSecurityQuestionAndUnlock = () => {
    const hasSecurityQuestion = localStorage.getItem("shadowself-security-answer");
    if (!hasSecurityQuestion) {
      setShowSecurityQuestion(true);
    } else {
      setTimeout(() => onUnlock(), 500);
    }
  };

  const offerBiometricAndUnlock = () => {
    if (biometricAvailable && !isBiometricEnabled()) {
      toast.success("Correct! Enable biometric for faster access?", {
        action: {
          label: "Enable",
          onClick: () => {
            enableBiometric();
            toast.success("Biometric enabled");
          }
        }
      });
    }
    setTimeout(() => onUnlock(), 500);
  };

  const handleForgotPin = () => {
    setShowForgotPin(true);
  };

  const handleResetPin = (newPin: string) => {
    localStorage.setItem("shadowself-pin", newPin);
    localStorage.setItem("shadowself-security-type", "pin");
    setShowForgotPin(false);
    setPin("");
    toast.success("PIN reset successfully");
  };

  const handleSecurityQuestionSave = (question: string, answer: string) => {
    localStorage.setItem("shadowself-security-question", question);
    localStorage.setItem("shadowself-security-answer", answer.toLowerCase().trim());
    setShowSecurityQuestion(false);
    toast.success("Security question saved");
    setTimeout(() => onUnlock(), 500);
  };

  const handleSecurityTypeChange = (type: SecurityType) => {
    if (type === "biometric" && !biometricAvailable) {
      toast.error("Biometric not available on this device");
      return;
    }
    setSecurityType(type);
    // Reset all inputs
    setPin("");
    setConfirmPin("");
    setPassword("");
    setConfirmPassword("");
    setPattern([]);
    setConfirmPattern([]);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (securityType === "password") {
        handlePasswordSubmit();
      } else if (securityType === "pin" && step === "create" && pin.length === 4) {
        setStep("confirm");
        setConfirmPin("");
      }
    }
  };

  const getCurrentValue = () => {
    if (securityType === "pin") {
      return step === "confirm" ? confirmPin : pin;
    }
    if (securityType === "password") {
      return step === "confirm" ? confirmPassword : password;
    }
    return "";
  };

  const currentPattern = step === "confirm" ? confirmPattern : pattern;
  const currentValue = getCurrentValue();

  const getTitle = () => {
    const typeLabel = securityType === "pin" ? "PIN" : securityType === "password" ? "Password" : "Pattern";
    if (step === "create") return `Create your ${typeLabel}`;
    if (step === "confirm") return `Confirm your ${typeLabel}`;
    return `Enter your ${typeLabel}`;
  };

  const getDescription = () => {
    if (step === "create") {
      if (securityType === "pin") return "Choose a 4-digit PIN to protect your confessions";
      if (securityType === "password") return "Create a password (at least 6 characters)";
      if (securityType === "pattern") return "Connect at least 4 dots to create your pattern";
    }
    if (step === "confirm") {
      return `Enter your ${securityType} again to confirm`;
    }
    return "Unlock to access your private confessions";
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6 w-full">
        {isLoading ? (
          <div className="animate-fade-in space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <Lock className="w-24 h-24 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ShadowSelf
              </h1>
              <p className="text-muted-foreground text-lg animate-pulse">
                Your safe space is loading...
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Your data never leaves this device</span>
            </div>
          </div>
        ) : (
          <div className={cn("animate-fade-in space-y-6", shake && "animate-shake")}>
            {/* Lock Icon */}
            <div className="space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                {((securityType === "pin" && currentValue.length === 4) ||
                  (securityType === "password" && currentValue.length >= 6) ||
                  (securityType === "pattern" && currentPattern.length >= 4)) && !error ? (
                  <Unlock className="w-16 h-16 text-primary animate-scale-in" />
                ) : (
                  <Lock className="w-16 h-16 text-primary" />
                )}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{getTitle()}</h2>
                <p className="text-sm text-muted-foreground">{getDescription()}</p>
              </div>
            </div>

            {/* Security Type Selector - Only show when creating */}
            {step === "create" && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Choose Security Type
                </label>
                <Select value={securityType} onValueChange={(v) => handleSecurityTypeChange(v as SecurityType)}>
                  <SelectTrigger className="w-full glass-effect border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {securityOptions.filter(opt => opt.available).map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        <div className="flex items-center gap-3">
                          <option.icon className="w-4 h-4 text-primary" />
                          <div className="text-left">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* PIN Input */}
            {securityType === "pin" && (
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                        currentValue.length > i
                          ? "border-primary bg-primary/20 scale-105"
                          : "border-border",
                        error && "border-destructive"
                      )}
                    >
                      {currentValue.length > i && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-scale-in" />
                      )}
                    </div>
                  ))}
                </div>
                <Input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={currentValue}
                  onChange={handlePinChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  className="text-center text-lg tracking-[0.5em] bg-card border-border focus:border-primary h-12"
                />
                {step === "create" && pin.length === 4 && (
                  <Button onClick={() => { setStep("confirm"); setConfirmPin(""); }} className="w-full">
                    Continue
                  </Button>
                )}
              </div>
            )}

            {/* Password Input */}
            {securityType === "password" && (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type={showPassword ? "text" : "password"}
                    value={step === "confirm" ? confirmPassword : password}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    placeholder={step === "create" ? "Create password (6+ characters)" : step === "confirm" ? "Confirm password" : "Enter password"}
                    autoFocus
                    className="bg-card border-border focus:border-primary h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handlePasswordSubmit} className="w-full">
                  {step === "create" ? "Continue" : step === "confirm" ? "Confirm" : "Unlock"}
                </Button>
              </div>
            )}

            {/* Pattern Input */}
            {securityType === "pattern" && (
              <div className="space-y-4">
                <div 
                  ref={patternRef}
                  className="grid grid-cols-3 gap-4 max-w-[200px] mx-auto p-4"
                >
                  {PATTERN_DOTS.map((index) => (
                    <button
                      key={index}
                      onClick={() => handlePatternDotClick(index)}
                      className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                        currentPattern.includes(index)
                          ? "border-primary bg-primary/30 scale-110"
                          : "border-border hover:border-primary/50 hover:bg-primary/10",
                        error && "border-destructive"
                      )}
                    >
                      {currentPattern.includes(index) && (
                        <span className="text-xs font-bold text-primary">
                          {currentPattern.indexOf(index) + 1}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentPattern.length}/4 dots selected (minimum 4)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearPattern} className="flex-1" disabled={currentPattern.length === 0}>
                    Clear
                  </Button>
                  <Button onClick={handlePatternComplete} className="flex-1" disabled={currentPattern.length < 4}>
                    {step === "create" ? "Continue" : step === "confirm" ? "Confirm" : "Unlock"}
                  </Button>
                </div>
              </div>
            )}

            {/* Biometric as primary */}
            {securityType === "biometric" && step === "create" && (
              <div className="space-y-4">
                <div className="p-6 glass-effect rounded-2xl">
                  <Fingerprint className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Use your device's biometric authentication (Face ID / Touch ID) to secure your confessions.
                  </p>
                </div>
                <Button onClick={handleBiometricAuth} className="w-full gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Enable Biometric
                </Button>
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm animate-fade-in">{error}</p>
            )}

            {/* Biometric option when entering */}
            {biometricAvailable && step === "enter" && securityType !== "biometric" && (
              <Button
                onClick={handleBiometricAuth}
                variant="outline"
                className="w-full gap-2 glass-effect hover:bg-primary/10"
              >
                <Fingerprint className="w-5 h-5" />
                Use {Capacitor.getPlatform() === 'ios' ? 'Face ID / Touch ID' : 'Biometric'} instead
              </Button>
            )}

            {/* Forgot PIN/Password */}
            {step === "enter" && (securityType === "pin" || securityType === "password") && (
              <Button
                onClick={handleForgotPin}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                Forgot {securityType === "pin" ? "PIN" : "Password"}?
              </Button>
            )}

            {/* Privacy notice */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3 text-primary" />
                <span>Encrypted & stored only on this device</span>
              </div>
              <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                No servers, no cloud, no one else can see your confessions.
              </p>
            </div>
          </div>
        )}
      </div>

      <ForgotPinDialog
        open={showForgotPin}
        onOpenChange={setShowForgotPin}
        onReset={handleResetPin}
      />

      <SecurityQuestionDialog
        open={showSecurityQuestion}
        onOpenChange={setShowSecurityQuestion}
        onSave={handleSecurityQuestionSave}
      />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
