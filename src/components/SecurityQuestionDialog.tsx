import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: string, answer: string) => void;
}

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your favorite book?",
  "What was your childhood nickname?",
];

const answerSchema = z.string()
  .trim()
  .min(2, "Answer must be at least 2 characters")
  .max(100, "Answer must be less than 100 characters");

export const SecurityQuestionDialog = ({ open, onOpenChange, onSave }: SecurityQuestionDialogProps) => {
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    try {
      answerSchema.parse(answer);
      onSave(question, answer);
      setAnswer("");
      setError("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <DialogTitle>Set Security Question</DialogTitle>
          </div>
          <DialogDescription>
            This will help you recover your PIN if you forget it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Choose a security question</Label>
            <Select value={question} onValueChange={setQuestion}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECURITY_QUESTIONS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-xs text-muted-foreground">
              Make sure you remember this answer - it's your only way to recover your PIN
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={answer.trim().length < 2}
          >
            Save Security Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
