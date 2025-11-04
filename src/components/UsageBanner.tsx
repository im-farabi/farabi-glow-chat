import { useState, useEffect } from 'react';
import { calculateTotalCost } from '@/lib/storage';
import { DollarSign } from 'lucide-react';

const UsageBanner = () => {
  const [cost, setCost] = useState<string>('0.00');

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
    const totalCost = calculateTotalCost();
    setCost(totalCost.toFixed(2));
  };

  return (
    <div className="bg-accent/50 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-green-500" />
        <p className="text-sm font-semibold text-foreground">
          You've used ${cost} worth of answers.
        </p>
      </div>
      <p className="text-xs text-muted-foreground pl-6">
        This amount won't be charged to you.
      </p>
    </div>
  );
};

export default UsageBanner;
