import { useEffect, useRef } from 'react';
import { getCursorPreference } from '@/lib/storage';

// Click sound effects (using data URIs for small sound effects)
const CLICK_SOUNDS = {
  professional: '/sounds/click-professional.mp3',
  cartoony: '/sounds/click-cartoony.mp3',
};

export function useCursorEffects() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const cursorType = getCursorPreference();
    
    // Only add effects for custom cursors
    if (cursorType === 'default') return;

    // Create ripple effect on click
    const createRipple = (e: MouseEvent) => {
      const ripple = document.createElement('div');
      ripple.className = 'cursor-click-effect';
      ripple.style.left = `${e.clientX - 20}px`;
      ripple.style.top = `${e.clientY - 20}px`;
      
      document.body.appendChild(ripple);
      
      // Play sound effect
      if (cursorType === 'professional') {
        playClickSound('professional');
      }
      
      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    // Click animations are handled via ripple effect only

    const playClickSound = (type: 'professional') => {
      try {
        // Create oscillator for synthetic click sound if files don't exist
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Professional cursor sound
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        // Quick click sound
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // Silently fail if audio not supported
        console.debug('Audio not supported');
      }
    };

    document.addEventListener('click', createRipple);

    return () => {
      document.removeEventListener('click', createRipple);
    };
  }, []);
}
