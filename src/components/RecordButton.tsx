import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const RecordButton = ({ isRecording, onClick, disabled }: RecordButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
        "focus:outline-none focus:ring-4 focus:ring-primary/30",
        isRecording
          ? "bg-destructive shadow-glow scale-110"
          : "bg-primary shadow-glow hover:scale-105",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isRecording ? (
        <Square className="w-8 h-8 text-destructive-foreground fill-current" />
      ) : (
        <Mic className="w-10 h-10 text-primary-foreground" />
      )}
      {isRecording && (
        <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-20" />
      )}
    </button>
  );
};
