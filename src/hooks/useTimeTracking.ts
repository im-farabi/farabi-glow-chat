import { useEffect } from 'react';
import { deductTimeBasedCost } from '@/lib/storage';

export const useTimeTracking = () => {
  useEffect(() => {
    // Track time spent on website and deduct $0.00046 per minute
    // Check every 2 minutes instead of 1 to reduce overhead
    const interval = setInterval(() => {
      if (!document.hidden) {
        deductTimeBasedCost();
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(interval);
  }, []);
};
