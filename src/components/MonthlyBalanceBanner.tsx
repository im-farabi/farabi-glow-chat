import { useState, useEffect } from 'react';
import { getMonthlyBalance } from '@/lib/storage';
import { DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useNavigate } from 'react-router-dom';

const MonthlyBalanceBanner = () => {
  const [balance, setBalance] = useState<number>(3.00);
  const [showAdDialog, setShowAdDialog] = useState(false);
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

  const updateBalance = () => {
    const balanceData = getMonthlyBalance();
    setBalance(balanceData.balance);
  };

  const handleGetMore = () => {
    setShowAdDialog(true);
  };

  const handleWatchAd = () => {
    setShowAdDialog(false);
    // Set timestamp when ad was initiated
    localStorage.setItem('adStartTime', Date.now().toString());
    // Open in new tab
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
                ${balance.toFixed(2)}/3.00$ Monthly Remaining
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MonthlyBalanceBanner;
