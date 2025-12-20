import { useState, useEffect } from "react";
import { 
  Settings, 
  Shield, 
  Trash2, 
  Info, 
  Lock, 
  Database,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { clearAllAppData, getAppStats } from "@/lib/deviceId";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confessionCount: number;
  onResetComplete: () => void;
}

export const SettingsDialog = ({ 
  open, 
  onOpenChange, 
  confessionCount,
  onResetComplete 
}: SettingsDialogProps) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [stats, setStats] = useState<{
    deviceId: string;
    createdAt: string | null;
    storageUsed: string;
  } | null>(null);
  const [showDeviceId, setShowDeviceId] = useState(false);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open]);

  const loadStats = async () => {
    const appStats = await getAppStats();
    setStats({
      deviceId: appStats.deviceId,
      createdAt: appStats.createdAt,
      storageUsed: appStats.storageUsed,
    });
  };

  const handleReset = async () => {
    if (confirmText !== "RESET") {
      toast.error("Please type RESET to confirm");
      return;
    }

    setIsResetting(true);
    try {
      await clearAllAppData();
      toast.success("All data cleared. Restarting app...");
      setTimeout(() => {
        onResetComplete();
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("Failed to reset app");
      setIsResetting(false);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-effect border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings & Privacy
            </DialogTitle>
            <DialogDescription>
              Manage your vault and understand how your data is protected
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Privacy Assurance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your Privacy Guarantees
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">100% Local Storage:</strong> All your confessions are stored only on this device. Nothing is ever uploaded to any server.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Device Isolation:</strong> Your data is tied to this specific device. No one else can access it, even with the same app.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">PIN Protected:</strong> Your vault is protected by a PIN that you set. Without it, no one can access your confessions.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">No Account Needed:</strong> We don't collect any personal information. No email, no phone number, nothing.
                  </p>
                </div>
              </div>
            </div>

            {/* Vault Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Database className="w-4 h-4" />
                Your Vault
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-effect rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Confessions</p>
                  <p className="text-xl font-semibold">{confessionCount}</p>
                </div>
                <div className="glass-effect rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                  <p className="text-xl font-semibold">{stats?.storageUsed || "..."}</p>
                </div>
              </div>
              
              <div className="glass-effect rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Device ID (unique to you)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowDeviceId(!showDeviceId)}
                  >
                    {showDeviceId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-sm font-mono">
                  {showDeviceId ? `...${stats?.deviceId}` : "••••••••"}
                </p>
              </div>
              
              <div className="glass-effect rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Vault Created</p>
                <p className="text-sm">{formatDate(stats?.createdAt || null)}</p>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Security
              </h3>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Your PIN and security question answers are stored securely on your device. 
                  If you forget them and can't recover, you'll need to reset the app.
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4 pt-4 border-t border-destructive/20">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Reset your app to start completely fresh. This will permanently delete:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>All your confessions ({confessionCount} total)</li>
                  <li>Your PIN and security settings</li>
                  <li>All app preferences</li>
                </ul>
                <p className="text-sm text-destructive font-medium">
                  ⚠️ This action cannot be undone!
                </p>
                
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowResetConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Reset App & Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="glass-effect border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Complete Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                You are about to permanently delete all your data, including {confessionCount} confessions.
              </p>
              <p>
                Type <strong className="text-foreground">RESET</strong> below to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type RESET"
                className="w-full p-3 rounded-lg bg-background border-2 border-border focus:border-destructive focus:outline-none text-center font-mono"
                autoComplete="off"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={confirmText !== "RESET" || isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? "Resetting..." : "Delete Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};