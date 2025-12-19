import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Apple, ArrowLeft, Check, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PremiumBackground from '@/components/PremiumBackground';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(isInStandaloneMode);

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
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PremiumBackground />
      
      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to FARABI
        </Link>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/pwa-192x192.png" alt="FARABI App Icon" className="w-20 h-20 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Install <span className="text-primary">FARABI</span>
          </h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="bg-card/50 backdrop-blur border-primary/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Already Installed!</h2>
                <p className="text-muted-foreground mb-4">
                  FARABI is already installed on your device. You can find it on your home screen.
                </p>
                <Link to="/">
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    Open FARABI
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Direct Install Button (for supported browsers) */}
            {isInstallable && (
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={handleInstall}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Install FARABI Now
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      One-click install available for your browser
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* iOS Instructions */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Apple className="h-5 w-5" />
                  iPhone & iPad (Safari)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">1</span>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground">Look for the square with an arrow at the bottom of Safari</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">2</span>
                    <div>
                      <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">You may need to scroll down in the share menu</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">3</span>
                    <div>
                      <p className="font-medium">Tap "Add"</p>
                      <p className="text-sm text-muted-foreground">The app icon will appear on your home screen</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Android Instructions */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5" />
                  Android (Chrome)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">1</span>
                    <div>
                      <p className="font-medium">Tap the menu button</p>
                      <p className="text-sm text-muted-foreground">Look for three dots (⋮) in the top right of Chrome</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">2</span>
                    <div>
                      <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">You may see an install banner at the bottom instead</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-medium">3</span>
                    <div>
                      <p className="font-medium">Confirm installation</p>
                      <p className="text-sm text-muted-foreground">The app will be added to your home screen and app drawer</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Why Install?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Launch instantly from your home screen</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Full-screen experience without browser UI</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Works offline (cached pages and settings)</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Faster loading after first visit</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>No app store download needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
