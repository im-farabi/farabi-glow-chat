import { useEffect } from 'react';
import { deductTimeBasedCost } from '@/lib/storage';

export const useTimeTracking = () => {
  useEffect(() => {
    // Track time spent on website and deduct $0.00046 per minute
    const interval = setInterval(() => {
      if (!document.hidden) {
        deductTimeBasedCost();
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);
};
