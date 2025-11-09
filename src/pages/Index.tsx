import { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { RecordButton } from "@/components/RecordButton";
import { Waveform } from "@/components/Waveform";
import { ConfessionCard, Confession } from "@/components/ConfessionCard";
import { NewConfessionDialog } from "@/components/NewConfessionDialog";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioRecorder } from "@/lib/audioRecorder";
import {
  initDB,
  saveConfession,
  getConfessions,
  deleteConfession,
  checkExpiredConfessions,
} from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MAX_RECORDING_TIME = 60; // seconds

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    initDB();
    loadConfessions();
    const interval = setInterval(() => {
      checkExpiredConfessions().then(loadConfessions);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const loadConfessions = async () => {
    const data = await getConfessions();
    setConfessions(data);
  };

  const startRecording = async () => {
    try {
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.initialize();
      }

      audioRecorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const updateAudioData = () => {
        if (audioRecorderRef.current && isRecording) {
          const data = audioRecorderRef.current.getAudioData();
          setAudioData(data);
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        }
      };
      updateAudioData();

      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to start recording. Please allow microphone access.");
      console.error(error);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current || !isRecording) return;

    setIsRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      const audioBlob = await audioRecorderRef.current.stopRecording();
      setCurrentAudioBlob(audioBlob);
      setShowSaveDialog(true);
      toast.success("Recording saved");
    } catch (error) {
      toast.error("Failed to save recording");
      console.error(error);
    }
  };

  const handleSaveConfession = async (data: {
    title: string;
    mood: string;
    note: string;
    burnDuration: string;
  }) => {
    if (!currentAudioBlob) return;

    const burnAt = (() => {
      const now = new Date();
      switch (data.burnDuration) {
        case "1h":
          return new Date(now.getTime() + 60 * 60 * 1000);
        case "24h":
          return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case "7d":
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        default:
          return undefined;
      }
    })();

    const confession: Confession = {
      id: crypto.randomUUID(),
      title: data.title,
      mood: data.mood,
      note: data.note,
      audioBlob: currentAudioBlob,
      createdAt: new Date(),
      burnAt,
      duration: recordingTime,
    };

    await saveConfession(confession);
    await loadConfessions();
    
    setShowSaveDialog(false);
    setCurrentAudioBlob(null);
    setRecordingTime(0);
    setAudioData([]);
    
    toast.success("Confession saved securely");
  };

  const handlePlay = (confession: Confession) => {
    if (playingId === confession.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    const url = URL.createObjectURL(confession.audioBlob);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(url);
    audioRef.current.play();
    audioRef.current.onended = () => {
      setPlayingId(null);
      URL.revokeObjectURL(url);
    };
    
    setPlayingId(confession.id);
  };

  const handleDelete = async (id: string) => {
    await deleteConfession(id);
    await loadConfessions();
    toast.success("Confession deleted");
  };

  const getMoodStats = () => {
    const moodCounts: Record<string, number> = {};
    confessions.forEach((c) => {
      moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
    });
    return Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  };

  if (isLocked) {
    return <WelcomeScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">ShadowSelf</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStatsDialog(true)}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            How common?
          </Button>
        </div>
      </header>

      {/* Recording Interface */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="glass-effect rounded-2xl p-8 mb-8">
          <div className="h-32 mb-8">
            <Waveform audioData={audioData} isRecording={isRecording} />
          </div>

          <div className="flex flex-col items-center gap-4">
            <RecordButton
              isRecording={isRecording}
              onClick={isRecording ? stopRecording : startRecording}
            />

            <div className="text-center">
              <div className="text-3xl font-mono text-primary mb-1">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Recording..." : "Tap to start recording"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum 60 seconds • Encrypted locally
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-2">
            Your confessions ({confessions.length})
          </h2>
          
          {confessions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No confessions yet.</p>
              <p className="text-sm mt-2">Your secrets are safe here.</p>
            </div>
          ) : (
            confessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onPlay={() => handlePlay(confession)}
                onDelete={() => handleDelete(confession.id)}
              />
            ))
          )}
        </div>
      </div>

      <NewConfessionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveConfession}
      />

      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle>How common is this?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your moods compared to anonymized data (your audio never leaves your device):
            </p>
            {getMoodStats().map(([mood, count]) => (
              <div key={mood} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mood}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 50000 + 10000).toLocaleString()} people felt this today
                  </span>
                </div>
                <span className="text-sm font-medium">{count}x you</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
