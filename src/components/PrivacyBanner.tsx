import { Shield, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const PrivacyBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const hasSeen = localStorage.getItem("shadowself-privacy-banner-seen");
    if (!hasSeen) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("shadowself-privacy-banner-seen", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in max-w-md mx-auto">
      <div className="glass-effect rounded-2xl p-4 border border-primary/20 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-sm">Your Privacy is Sacred</h3>
            <p className="text-xs text-muted-foreground">
              Everything you share here stays on your device only. No servers, no cloud, 
              no one else can ever see your confessions. Your secrets are truly yours.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs"
            >
              I understand
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};