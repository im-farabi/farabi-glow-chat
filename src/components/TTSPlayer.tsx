import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';

interface TTSPlayerProps {
  text: string;
  onClose: () => void;
}

const TTSPlayer = ({ text, onClose }: TTSPlayerProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    
    // Clean text: remove emojis, hashtags, and special symbols
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and pictographs
      .replace(/#\w+/g, '')                    // Hashtags
      .replace(/\*\*/g, '')                    // Bold markdown
      .replace(/\*/g, '')                      // Italic markdown
      .replace(/`/g, '')                       // Code markdown
      .replace(/\s+/g, ' ')                    // Multiple spaces
      .trim();
    
    const u = new SpeechSynthesisUtterance(cleanText);
    
    u.onend = () => {
      onClose();
    };
    
    setUtterance(u);
    synth.speak(u);

    return () => {
      synth.cancel();
    };
  }, [text, onClose]);

  const handleToggle = () => {
    const synth = window.speechSynthesis;
    
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
    } else {
      synth.pause();
      setIsPaused(true);
    }
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-secondary p-4 shadow-lg animate-fade-in">
      <div className="container mx-auto flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span className="text-white font-medium">Reading the text...</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TTSPlayer;
