import { useState, useEffect } from 'react';
import { calculateTotalCost } from '@/lib/storage';
import { DollarSign } from 'lucide-react';

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
    
    // Also check periodically in case same-tab updates
    const interval = setInterval(updateCost, 1000);
    
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
  );
};

export default UsageBanner;
