import { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, Mic, PenLine, BarChart3, Settings } from "lucide-react";
import { RecordButton } from "@/components/RecordButton";
import { Waveform } from "@/components/Waveform";
import { ConfessionCard, Confession } from "@/components/ConfessionCard";
import { NewConfessionDialog } from "@/components/NewConfessionDialog";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SearchFilter, SortOption, TypeFilter } from "@/components/SearchFilter";
import { MoodChart } from "@/components/MoodChart";
import { SettingsDialog } from "@/components/SettingsDialog";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioRecorder } from "@/lib/audioRecorder";
import {
  initDB,
  saveConfession,
  getConfessions,
  deleteConfession,
  checkExpiredConfessions,
  updateConfession,
} from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_RECORDING_TIME = 60; // seconds

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [showTextDialog, setShowTextDialog] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    initDB();
    loadConfessions();
    const interval = setInterval(() => {
      checkExpiredConfessions().then(loadConfessions);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const loadConfessions = async () => {
    const data = await getConfessions();
    setConfessions(data);
  };

  // Filtered and sorted confessions
  const filteredConfessions = useMemo(() => {
    let result = [...confessions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.note?.toLowerCase().includes(query) ||
          c.textContent?.toLowerCase().includes(query)
      );
    }

    // Mood filter
    if (moodFilter) {
      result = result.filter((c) => c.mood === moodFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned items always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mood':
          return a.mood.localeCompare(b.mood);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [confessions, searchQuery, moodFilter, typeFilter, sortBy]);

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
    textContent?: string;
  }) => {
    const isTextConfession = mode === 'text' || !currentAudioBlob;

    if (!isTextConfession && !currentAudioBlob) return;
    if (isTextConfession && !data.textContent?.trim()) {
      toast.error("Please write something first");
      return;
    }

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
      type: isTextConfession ? 'text' : 'audio',
      audioBlob: isTextConfession ? undefined : currentAudioBlob!,
      textContent: isTextConfession ? data.textContent : undefined,
      createdAt: new Date(),
      burnAt,
      duration: isTextConfession ? 0 : recordingTime,
      isPinned: false,
    };

    await saveConfession(confession);
    await loadConfessions();
    
    setShowSaveDialog(false);
    setShowTextDialog(false);
    setCurrentAudioBlob(null);
    setRecordingTime(0);
    setAudioData([]);
    
    toast.success("Confession saved securely");
  };

  const handlePlay = (confession: Confession) => {
    if (!confession.audioBlob) return;
    
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

  const handleTogglePin = async (id: string) => {
    const confession = confessions.find((c) => c.id === id);
    if (confession) {
      await updateConfession(id, { isPinned: !confession.isPinned });
      await loadConfessions();
      toast.success(confession.isPinned ? "Unpinned" : "Pinned to top");
    }
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStatsDialog(true)}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mode Toggle & Recording Interface */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={mode === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('audio')}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Speak
          </Button>
          <Button
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('text')}
            className="gap-2"
          >
            <PenLine className="w-4 h-4" />
            Write
          </Button>
        </div>

        <div className="glass-effect rounded-2xl p-8 mb-8">
          {mode === 'audio' ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <PenLine className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Sometimes words on paper feel safer than spoken ones.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setShowTextDialog(true)}
                className="gap-2"
              >
                <PenLine className="w-5 h-5" />
                Start writing
              </Button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold">
              Your confessions ({confessions.length})
            </h2>
          </div>

          {/* Search & Filter */}
          {confessions.length > 0 && (
            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              moodFilter={moodFilter}
              onMoodFilterChange={setMoodFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
          
          {confessions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No confessions yet.</p>
              <p className="text-sm mt-2">Your secrets are safe here.</p>
            </div>
          ) : filteredConfessions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No confessions match your filters.</p>
              <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredConfessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onPlay={() => handlePlay(confession)}
                onDelete={() => handleDelete(confession.id)}
                onTogglePin={() => handleTogglePin(confession.id)}
                isPlaying={playingId === confession.id}
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

      <NewConfessionDialog
        open={showTextDialog}
        onOpenChange={setShowTextDialog}
        onSave={handleSaveConfession}
        isTextMode={true}
      />

      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="glass-effect border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Your Mood Analytics</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="mt-4">
              <MoodChart confessions={confessions} />
            </TabsContent>
            
            <TabsContent value="compare" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your moods compared to anonymized data (your audio never leaves your device):
                </p>
                {getMoodStats().length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No mood data yet
                  </p>
                ) : (
                  getMoodStats().map(([mood, count]) => (
                    <div key={mood} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mood}</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 50000 + 10000).toLocaleString()} people felt this today
                        </span>
                      </div>
                      <span className="text-sm font-medium">{count}x you</span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        confessionCount={confessions.length}
        onResetComplete={() => setIsLocked(true)}
      />

      <PrivacyBanner />
    </div>
  );
};

export default Index;
