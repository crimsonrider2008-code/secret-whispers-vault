import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Unlock, Fingerprint, Keyboard, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface WelcomeScreenProps {
  onUnlock: () => void;
}

type InputMode = "numpad" | "keyboard";

export const WelcomeScreen = ({ onUnlock }: WelcomeScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"create" | "confirm" | "enter">("enter");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("numpad");
  
  const keyboardInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard input globally
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showForgotPin || showSecurityQuestion) return;
    
    // Handle number keys (both main keyboard and numpad)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handlePinInputDirect(e.key);
    }
    // Handle backspace/delete
    else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      handleDeleteDirect();
    }
    // Handle Enter for next step
    else if (e.key === "Enter" && step === "create" && pin.length === 4) {
      e.preventDefault();
      handleNext();
    }
  }, [step, pin, confirmPin, showForgotPin, showSecurityQuestion]);

  useEffect(() => {
    // Add global keyboard listener
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const existingPin = localStorage.getItem("shadowself-pin");
    
    // Check biometric availability
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      
      // Auto-trigger biometric if enabled and available
      if (available && isBiometricEnabled() && existingPin) {
        const success = await authenticateWithBiometric();
        if (success) {
          onUnlock();
          return true;
        }
      }
      return false;
    };
    
    // Show loading animation
    setTimeout(async () => {
      const biometricSuccess = await checkBiometric();
      
      if (!biometricSuccess) {
        setIsLoading(false);
        setTimeout(() => {
          if (!existingPin) {
            setIsCreatingPin(true);
            setStep("create");
          } else {
            setStep("enter");
          }
          setShowPinEntry(true);
        }, 500);
      }
    }, 2000);
  }, [onUnlock]);

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

  // Direct handlers for keyboard input (without haptic for better UX)
  const handlePinInputDirect = (digit: string) => {
    if (step === "create") {
      if (pin.length < 4) {
        setPin(prev => prev + digit);
        setError("");
      }
    } else if (step === "confirm") {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 4) {
          if (newConfirmPin === pin) {
            localStorage.setItem("shadowself-pin", pin);
            
            const hasSecurityQuestion = localStorage.getItem("shadowself-security-answer");
            if (!hasSecurityQuestion) {
              setShowSecurityQuestion(true);
            } else {
              setTimeout(() => onUnlock(), 500);
            }
          } else {
            setError("PINs don't match");
            setShake(true);
            setTimeout(() => {
              setPin("");
              setConfirmPin("");
              setStep("create");
              setShake(false);
            }, 1000);
          }
        }
      }
    } else {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        
        if (newPin.length === 4) {
          const storedPin = localStorage.getItem("shadowself-pin");
          if (newPin === storedPin) {
            if (biometricAvailable && !isBiometricEnabled()) {
              toast.success("PIN correct! Enable biometric for faster access?", {
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
          } else {
            setError("Incorrect PIN");
            setShake(true);
            setTimeout(() => {
              setPin("");
              setShake(false);
              setError("");
            }, 1000);
          }
        }
      }
    }
  };

  const handleDeleteDirect = () => {
    setError("");
    if (step === "confirm") {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handlePinInput = async (digit: string) => {
    await triggerHaptic();
    handlePinInputDirect(digit);
  };

  const handleDelete = async () => {
    await triggerHaptic();
    handleDeleteDirect();
  };

  const handleNext = () => {
    if (step === "create" && pin.length === 4) {
      setStep("confirm");
      setError("");
    }
  };

  const handleForgotPin = () => {
    setShowForgotPin(true);
  };

  const handleResetPin = (newPin: string) => {
    localStorage.setItem("shadowself-pin", newPin);
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

  const toggleInputMode = () => {
    setInputMode(prev => prev === "numpad" ? "keyboard" : "numpad");
    // Focus the keyboard input when switching to keyboard mode
    if (inputMode === "numpad") {
      setTimeout(() => keyboardInputRef.current?.focus(), 100);
    }
  };

  const handleKeyboardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    
    if (step === "confirm") {
      setConfirmPin(value);
      
      if (value.length === 4) {
        if (value === pin) {
          localStorage.setItem("shadowself-pin", pin);
          const hasSecurityQuestion = localStorage.getItem("shadowself-security-answer");
          if (!hasSecurityQuestion) {
            setShowSecurityQuestion(true);
          } else {
            setTimeout(() => onUnlock(), 500);
          }
        } else {
          setError("PINs don't match");
          setShake(true);
          setTimeout(() => {
            setPin("");
            setConfirmPin("");
            setStep("create");
            setShake(false);
          }, 1000);
        }
      }
    } else if (step === "create") {
      setPin(value);
      setError("");
    } else {
      setPin(value);
      
      if (value.length === 4) {
        const storedPin = localStorage.getItem("shadowself-pin");
        if (value === storedPin) {
          if (biometricAvailable && !isBiometricEnabled()) {
            toast.success("PIN correct! Enable biometric for faster access?", {
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
        } else {
          setError("Incorrect PIN");
          setShake(true);
          setTimeout(() => {
            setPin("");
            setShake(false);
            setError("");
          }, 1000);
        }
      }
    }
  };

  const currentPin = step === "confirm" ? confirmPin : pin;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden"
      tabIndex={0}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
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
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
            </div>
          </div>
        ) : (
          <div 
            className={cn(
              "animate-fade-in space-y-6",
              shake && "animate-shake"
            )}
          >
            <div className="space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                {currentPin.length === 4 && !error ? (
                  <Unlock className="w-20 h-20 text-primary animate-scale-in" />
                ) : (
                  <Lock className="w-20 h-20 text-primary" />
                )}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {step === "create" && "Create your PIN"}
                  {step === "confirm" && "Confirm your PIN"}
                  {step === "enter" && "Enter your PIN"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {step === "create" && "Choose a 4-digit PIN to protect your confessions"}
                  {step === "confirm" && "Enter your PIN again to confirm"}
                  {step === "enter" && "Unlock to access your private confessions"}
                </p>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex justify-center gap-2">
              <Button
                variant={inputMode === "numpad" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("numpad")}
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Numpad
              </Button>
              <Button
                variant={inputMode === "keyboard" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setInputMode("keyboard");
                  setTimeout(() => keyboardInputRef.current?.focus(), 100);
                }}
                className="gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Keyboard
              </Button>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300",
                    currentPin.length > i
                      ? "border-primary bg-primary/20 scale-110"
                      : "border-border",
                    error && "border-destructive"
                  )}
                >
                  {currentPin.length > i && (
                    <div className="w-3 h-3 rounded-full bg-primary animate-scale-in" />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-destructive text-sm animate-fade-in">{error}</p>
            )}

            {/* Keyboard Mode Input */}
            {inputMode === "keyboard" && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    ref={keyboardInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={currentPin}
                    onChange={handleKeyboardInputChange}
                    placeholder="Enter 4-digit PIN"
                    autoFocus
                    className="w-full h-14 text-center text-2xl tracking-[1em] bg-card border-2 border-border rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:tracking-normal placeholder:text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Type your PIN using your keyboard or screen
                </p>
                {step === "create" && pin.length === 4 && (
                  <Button
                    onClick={handleNext}
                    className="w-full"
                  >
                    Next
                  </Button>
                )}
              </div>
            )}

            {/* Number Pad */}
            {inputMode === "numpad" && (
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    variant="outline"
                    className="h-16 text-xl font-semibold glass-effect hover:bg-primary/10 hover:border-primary transition-all"
                    disabled={currentPin.length >= 4}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="h-16 glass-effect hover:bg-destructive/10 hover:border-destructive"
                  disabled={currentPin.length === 0}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => handlePinInput("0")}
                  variant="outline"
                  className="h-16 text-xl font-semibold glass-effect hover:bg-primary/10 hover:border-primary"
                  disabled={currentPin.length >= 4}
                >
                  0
                </Button>
                {step === "create" && (
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    className="h-16 glass-effect hover:bg-primary/10 hover:border-primary"
                    disabled={pin.length !== 4}
                  >
                    Next
                  </Button>
                )}
                {step !== "create" && (
                  <div className="h-16" />
                )}
              </div>
            )}

            {/* Keyboard hint for numpad mode */}
            {inputMode === "numpad" && (
              <p className="text-xs text-muted-foreground">
                💡 You can also use your keyboard to type numbers
              </p>
            )}

            {/* Biometric Button */}
            {biometricAvailable && step === "enter" && (
              <Button
                onClick={handleBiometricAuth}
                variant="outline"
                className="w-full gap-2 glass-effect hover:bg-primary/10"
              >
                <Fingerprint className="w-5 h-5" />
                Use {Capacitor.getPlatform() === 'ios' ? 'Face ID / Touch ID' : 'Biometric'}
              </Button>
            )}

            {/* Forgot PIN */}
            {step === "enter" && (
              <Button
                onClick={handleForgotPin}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                Forgot PIN?
              </Button>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Your confessions are encrypted and stored only on this device
            </p>
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
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
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