import { useEffect, useState } from 'react';
import { addAdReward } from '@/lib/storage';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdRedirect = () => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [hasRewarded, setHasRewarded] = useState(false);
  const [adOpened, setAdOpened] = useState(false);
  const [cameBackEarly, setCameBackEarly] = useState(false);

  useEffect(() => {
    // Check if user already started watching an ad
    const startTime = localStorage.getItem('adStartTime');
    if (startTime) {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      
      if (elapsed >= 10) {
        // Already waited enough time
        setHasRewarded(true);
        addAdReward();
        localStorage.removeItem('adStartTime');
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      } else {
        // Came back early
        setTimeLeft(10 - elapsed);
        setCameBackEarly(true);
      }
    }

    // Randomly select one of the two URLs
    const adUrls = [
      'https://otieu.com/4/9133136',
      'https://otieu.com/4/9133133'
    ];
    const randomUrl = adUrls[Math.floor(Math.random() * adUrls.length)];
    
    if (!cameBackEarly && !adOpened) {
      // Open the ad in a new window/tab
      window.location.href = randomUrl;
      setAdOpened(true);
      
      // Store start time
      localStorage.setItem('adStartTime', Date.now().toString());
    }

    // Track time with visibility
    let isVisible = !document.hidden;

    const visibilityHandler = () => {
      isVisible = !document.hidden;
    };

    const timer = setInterval(() => {
      if (isVisible) {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0 && !hasRewarded) {
            setHasRewarded(true);
            addAdReward();
            localStorage.removeItem('adStartTime');
            setTimeout(() => {
              window.close();
            }, 2000);
          }
          
          return Math.max(0, newTime);
        });
      }
    }, 1000);

    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [hasRewarded, adOpened, cameBackEarly]);

  const handleContinueWatching = () => {
    const adUrls = [
      'https://otieu.com/4/9133136',
      'https://otieu.com/4/9133133'
    ];
    const randomUrl = adUrls[Math.floor(Math.random() * adUrls.length)];
    window.location.href = randomUrl;
    setCameBackEarly(false);
  };

  if (cameBackEarly) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">⏱️</div>
          <h1 className="text-2xl font-bold">You Came Back Too Early!</h1>
          <p className="text-muted-foreground text-lg">
            You came back <span className="font-bold text-destructive">{10 - timeLeft} seconds</span> early.
          </p>
          <p className="text-muted-foreground">
            Watch <span className="font-bold text-primary">{timeLeft} more seconds</span> to get your $0.10 reward.
          </p>
          <Button 
            onClick={handleContinueWatching}
            size="lg"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Continue Watching Ad
          </Button>
          <p className="text-xs text-muted-foreground">
            Stay on the ad page for the full duration to earn your reward
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Loading Advertisement</h1>
        <p className="text-muted-foreground">
          Stay on this page for {timeLeft} seconds to earn $0.10
        </p>
        {hasRewarded && (
          <div className="space-y-2">
            <p className="text-primary font-semibold text-xl">
              ✓ Reward Added!
            </p>
            <p className="text-sm text-muted-foreground">
              You earned $0.10. This window will close shortly...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdRedirect;
