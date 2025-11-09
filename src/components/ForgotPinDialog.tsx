import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ForgotPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (newPin: string) => void;
}

const securityQuestionSchema = z.object({
  answer: z.string()
    .trim()
    .min(2, "Answer must be at least 2 characters")
    .max(100, "Answer must be less than 100 characters"),
});

const pinSchema = z.string()
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits");

export const ForgotPinDialog = ({ open, onOpenChange, onReset }: ForgotPinDialogProps) => {
  const [step, setStep] = useState<"question" | "reset">("question");
  const [answer, setAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const storedQuestion = localStorage.getItem("shadowself-security-question") || "What is your mother's maiden name?";
  const storedAnswer = localStorage.getItem("shadowself-security-answer") || "";

  const handleVerifyAnswer = () => {
    try {
      securityQuestionSchema.parse({ answer });
      
      if (answer.toLowerCase().trim() === storedAnswer.toLowerCase().trim()) {
        setStep("reset");
        setError("");
      } else {
        setError("Incorrect answer. Please try again.");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  const handleResetPin = () => {
    try {
      pinSchema.parse(newPin);
      pinSchema.parse(confirmPin);

      if (newPin !== confirmPin) {
        setError("PINs don't match");
        return;
      }

      onReset(newPin);
      setAnswer("");
      setNewPin("");
      setConfirmPin("");
      setStep("question");
      setError("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  const handleClose = () => {
    setAnswer("");
    setNewPin("");
    setConfirmPin("");
    setStep("question");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-effect border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <DialogTitle>Reset PIN</DialogTitle>
          </div>
          <DialogDescription>
            {step === "question" 
              ? "Answer your security question to reset your PIN"
              : "Create a new 4-digit PIN"
            }
          </DialogDescription>
        </DialogHeader>

        {!storedAnswer ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No security question set up. You'll need to clear app data to reset your PIN.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {step === "question" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Security Question</Label>
                  <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                    {storedQuestion}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Input
                    id="answer"
                    type="text"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your answer"
                    className="bg-secondary border-border"
                    maxLength={100}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleVerifyAnswer} 
                    className="flex-1"
                    disabled={answer.trim().length < 2}
                  >
                    Verify
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-pin">New PIN</Label>
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNewPin(value);
                      setError("");
                    }}
                    placeholder="Enter 4-digit PIN"
                    className="bg-secondary border-border text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setConfirmPin(value);
                      setError("");
                    }}
                    placeholder="Confirm 4-digit PIN"
                    className="bg-secondary border-border text-center text-2xl tracking-widest"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleResetPin} 
                    className="flex-1"
                    disabled={newPin.length !== 4 || confirmPin.length !== 4}
                  >
                    Reset PIN
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
