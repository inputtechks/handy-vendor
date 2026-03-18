import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (isStandalone) return;

    if (isIOS) {
      const hidden = sessionStorage.getItem("pwa-ios-dismissed");
      if (!hidden) setShowIOSHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone, isIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const dismissIOS = () => {
    setShowIOSHint(false);
    sessionStorage.setItem("pwa-ios-dismissed", "1");
  };

  if (isStandalone || dismissed) return null;

  // Android / Chrome prompt
  if (deferredPrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-20 left-4 right-4 z-[90] bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-md mx-auto"
        >
          <Download className="h-6 w-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Install HelveLitt</p>
            <p className="text-xs text-muted-foreground">Use it like a native app — works offline!</p>
          </div>
          <Button size="sm" onClick={handleInstall}>Install</Button>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS hint
  if (showIOSHint) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-20 left-4 right-4 z-[90] bg-card border border-border rounded-xl shadow-lg p-4 max-w-md mx-auto"
        >
          <div className="flex items-start gap-3">
            <Share className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Install HelveLitt</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap the <strong>Share</strong> icon in Safari, then select <strong>"Add to Home Screen"</strong>.
              </p>
            </div>
            <button onClick={dismissIOS} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
