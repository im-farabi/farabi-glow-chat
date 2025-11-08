import { useEffect, useState } from 'react';
import { addAdReward } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AdRedirect = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(10);
  const [hasRewarded, setHasRewarded] = useState(false);

  useEffect(() => {
    // Randomly select one of the two URLs
    const adUrls = [
      'https://otieu.com/4/9133136',
      'https://otieu.com/4/9133133'
    ];
    const randomUrl = adUrls[Math.floor(Math.random() * adUrls.length)];
    
    // Open the ad in the current window
    window.location.href = randomUrl;

    // Track visibility and time
    let secondsOnPage = 0;
    let isVisible = !document.hidden;

    const visibilityHandler = () => {
      isVisible = !document.hidden;
    };

    const timer = setInterval(() => {
      if (isVisible) {
        secondsOnPage++;
        setTimeLeft(Math.max(0, 10 - secondsOnPage));
        
        if (secondsOnPage >= 10 && !hasRewarded) {
          setHasRewarded(true);
          addAdReward();
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      }
    }, 1000);

    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [navigate, hasRewarded]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Loading Advertisement</h1>
        <p className="text-muted-foreground">
          Stay on this page for {timeLeft} seconds to earn $0.10
        </p>
        {hasRewarded && (
          <p className="text-primary font-semibold">
            ✓ Reward added! Redirecting...
          </p>
        )}
      </div>
    </div>
  );
};

export default AdRedirect;
