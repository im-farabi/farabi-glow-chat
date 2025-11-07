import { useState, useEffect } from 'react';

type LoadingMode = 'fast' | 'normal' | 'super';

const loadingStages = {
  fast: [
    { time: 500, text: 'Sending...' },
    { time: 1000, text: 'Reading Instructions...' },
    { time: 1500, text: 'Searching Web...' },
    { time: Infinity, text: 'Thinking...' }
  ],
  normal: [
    { time: 500, text: 'Sending...' },
    { time: 1500, text: 'Reading Instructions...' },
    { time: 2000, text: 'Searching Web...' },
    { time: Infinity, text: 'Thinking...' }
  ],
  super: [
    { time: 500, text: 'Sending...' },
    { time: 2000, text: 'Reading Instructions...' },
    { time: 2500, text: 'Searching Web...' },
    { time: Infinity, text: 'Thinking...' }
  ]
};

export const useLoadingStages = (mode: LoadingMode, isActive: boolean) => {
  const [currentStage, setCurrentStage] = useState('Sending...');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      setCurrentStage('Sending...');
      return;
    }

    const startTime = Date.now();
    const stages = loadingStages[mode];

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      const currentStageData = stages.find(stage => elapsed < stage.time);
      if (currentStageData) {
        setCurrentStage(currentStageData.text);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [mode, isActive]);

  return currentStage;
};
