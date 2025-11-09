import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewConfessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    mood: string;
    note: string;
    burnDuration: string;
  }) => void;
}

const MOODS = ["😔", "😢", "😤", "😰", "💔", "😌", "🤔", "😶", "🙃", "😊"];

export const NewConfessionDialog = ({ open, onOpenChange, onSave }: NewConfessionDialogProps) => {
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("😶");
  const [note, setNote] = useState("");
  const [burnDuration, setBurnDuration] = useState("never");

  const handleSave = () => {
    onSave({ title, mood, note, burnDuration });
    setTitle("");
    setMood("😶");
    setNote("");
    setBurnDuration("never");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-border">
        <DialogHeader>
          <DialogTitle>Save your confession</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a name..."
              className="bg-secondary border-border"
            />
          </div>

          <div>
            <Label>Mood</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {MOODS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMood(emoji)}
                  className={`text-3xl p-2 rounded-lg transition-all ${
                    mood === emoji ? "bg-primary/20 scale-110" : "hover:bg-secondary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="note">Private note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How do you feel? What happened?"
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="burn">Auto-burn after</Label>
            <Select value={burnDuration} onValueChange={setBurnDuration}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save confession
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
