import { Play, Trash2, Clock, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export interface Confession {
  id: string;
  title: string;
  mood: string;
  note: string;
  audioBlob?: Blob;
  textContent?: string;
  type: 'audio' | 'text';
  createdAt: Date;
  burnAt?: Date;
  duration: number;
}

interface ConfessionCardProps {
  confession: Confession;
  onPlay: () => void;
  onDelete: () => void;
}

export const ConfessionCard = ({ confession, onPlay, onDelete }: ConfessionCardProps) => {
  const timeRemaining = confession.burnAt
    ? formatDistanceToNow(confession.burnAt, { addSuffix: true })
    : null;

  const isTextConfession = confession.type === 'text';

  return (
    <Card className="glass-effect p-4 hover:bg-secondary/50 transition-all">
      <div className="flex items-start gap-4">
        {isTextConfession ? (
          <div className="shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlay}
            className="shrink-0 w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30"
          >
            <Play className="w-5 h-5 text-primary fill-current" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{confession.mood}</span>
              <h3 className="font-medium text-foreground truncate">
                {confession.title || "Untitled confession"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {isTextConfession && confession.textContent && (
            <p className="text-sm text-foreground/80 mb-2 line-clamp-3 whitespace-pre-wrap">
              {confession.textContent}
            </p>
          )}

          {confession.note && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 italic">
              {confession.note}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {!isTextConfession && <span>{Math.round(confession.duration)}s</span>}
            {!isTextConfession && <span>•</span>}
            <span>{formatDistanceToNow(confession.createdAt, { addSuffix: true })}</span>
            {timeRemaining && (
              <>
                <span>•</span>
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Burns {timeRemaining}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
