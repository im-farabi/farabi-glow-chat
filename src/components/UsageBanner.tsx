import { useState, useEffect } from 'react';
import { calculateTotalCost } from '@/lib/storage';
import { DollarSign, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const UsageBanner = () => {
  const [costRounded, setCostRounded] = useState<string>('0.00');
  const [costFull, setCostFull] = useState<string>('0.0000000000');

  useEffect(() => {
    updateCost();
    
    // Listen for storage changes to update in real-time
    const handleStorageChange = () => {
      updateCost();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check less frequently - only every 5 seconds instead of every second
    const interval = setInterval(updateCost, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateCost = () => {
    const { rounded, full } = calculateTotalCost();
    setCostRounded(rounded.toFixed(2));
    
    // Format full precision up to 10 decimals
    const fullStr = full.toFixed(10);
    setCostFull(fullStr);
  };

  return (
    <>
      <div className="bg-accent/50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-green-500" />
          <p className="text-sm font-semibold text-foreground">
            You've used ${costRounded} worth of answers.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          This amount won't be charged to you.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Approx: ${costFull}
        </p>
      </div>
      
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-primary/10 rounded-lg p-3 mb-4 border border-primary/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <p className="text-sm font-semibold text-foreground">
              Support Us!
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            <Link to="/support">HELP</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default UsageBanner;
