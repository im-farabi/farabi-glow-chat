import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if dismissed
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleIOSInstall = () => {
    setShowIOSDialog(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Don't show if already installed, dismissed, or not installable on Android
  if (isStandalone || isDismissed) {
    return null;
  }

  // Show for iOS or when installable on other platforms
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-border/50 px-4 py-2">
        <div className="flex items-center justify-between gap-2 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Smartphone className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground/80 truncate">
              Install FARABI for quick access
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={isIOS ? handleIOSInstall : handleInstall}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground h-7 px-3 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7 w-7 hover:bg-accent/50"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install on iPhone/iPad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Follow these steps to install FARABI:
            </p>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-medium">1</span>
                <span>Tap the <strong>Share</strong> button in Safari (the square with arrow)</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-medium">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-medium">3</span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </li>
            </ol>
            <p className="text-muted-foreground text-xs">
              The app will appear on your home screen just like a native app!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallBanner;
