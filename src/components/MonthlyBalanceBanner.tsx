import { useState, useEffect } from 'react';
import { getMonthlyBalance, addAdReward, calculateTotalCost } from '@/lib/storage';
import { DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useNavigate } from 'react-router-dom';

const MonthlyBalanceBanner = () => {
  const [balance, setBalance] = useState<number>(3.00);
  const [usedAmount, setUsedAmount] = useState<number>(0);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [adStarted, setAdStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [cameBackEarly, setCameBackEarly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateBalance();
    
    const handleStorageChange = () => {
      updateBalance();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateBalance, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!adStarted) return;
    
    const startTime = localStorage.getItem('adStartTime');
    if (!startTime) {
      setAdStarted(false);
      return;
    }
    
    const checkTimer = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const remaining = 10 - elapsed;
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        // Reward earned
        addAdReward();
        localStorage.removeItem('adStartTime');
        setAdStarted(false);
        setShowAdDialog(false);
        setCameBackEarly(false);
        updateBalance();
      }
    };
    
    // Check immediately
    checkTimer();
    
    // Then check every second
    const interval = setInterval(checkTimer, 1000);
    
    return () => clearInterval(interval);
  }, [adStarted]);

  const updateBalance = () => {
    const balanceData = getMonthlyBalance();
    setBalance(balanceData.balance);
    
    // Get character-based usage cost
    const cost = calculateTotalCost();
    setUsedAmount(cost.rounded);
  };

  const handleGetMore = () => {
    setShowAdDialog(true);
  };

  const handleWatchAd = () => {
    const startTime = Date.now().toString();
    localStorage.setItem('adStartTime', startTime);
    setAdStarted(true);
    setTimeLeft(10);
    setCameBackEarly(false);
    
    // Open ad in new tab
    window.open('/ad', '_blank');
    
    // Start checking if user comes back early
    setTimeout(() => {
      const stored = localStorage.getItem('adStartTime');
      if (stored === startTime && document.hasFocus()) {
        // User came back while timer is still running
        const elapsed = Math.floor((Date.now() - parseInt(stored)) / 1000);
        if (elapsed < 10) {
          setCameBackEarly(true);
          setTimeLeft(10 - elapsed);
        }
      }
    }, 1000);
  };

  const handleContinueWatching = () => {
    setCameBackEarly(false);
    window.open('/ad', '_blank');
  };

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                ${usedAmount.toFixed(2)}/3.00$ Monthly Remaining
              </p>
              <p className="text-xs text-muted-foreground">
                It will reset every month
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetMore}
            className="shrink-0"
          >
            Get more
          </Button>
        </div>
      </div>

      <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Get More Balance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            {!adStarted && !cameBackEarly ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">WATCH AD</p>
                  <p className="text-2xl font-bold text-primary">Get $0.10 Per AD</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Must stay on the website for at least 10 seconds.
                </p>
                <Button 
                  onClick={handleWatchAd}
                  className="w-full"
                  size="lg"
                >
                  Watch Ad Now
                </Button>
              </>
            ) : cameBackEarly ? (
              <>
                <div className="text-6xl">⏱️</div>
                <h2 className="text-xl font-bold">You Came Back Too Early!</h2>
                <p className="text-muted-foreground text-center">
                  You came back <span className="font-bold text-destructive">{10 - timeLeft} seconds</span> early.
                </p>
                <p className="text-muted-foreground text-center">
                  Watch <span className="font-bold text-primary">{timeLeft} more seconds</span> to get your $0.10 reward.
                </p>
                <Button 
                  onClick={handleContinueWatching}
                  className="w-full"
                  size="lg"
                >
                  Continue Watching Ad
                </Button>
              </>
            ) : (
              <>
                <div className="text-6xl">⏱️</div>
                <h2 className="text-xl font-bold">{timeLeft} seconds remaining...</h2>
                <p className="text-muted-foreground text-center">
                  Stay on the ad page to earn your reward!
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MonthlyBalanceBanner;
