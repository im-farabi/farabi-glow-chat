import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdvancedTTSPlayerProps {
  text: string;
  onClose: () => void;
}

const AdvancedTTSPlayer = ({ text, onClose }: AdvancedTTSPlayerProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadAudio = async () => {
      try {
        // Clean text for TTS
        const cleanText = text
          .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
          .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
          .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
          .replace(/[\u{2600}-\u{26FF}]/gu, '')
          .replace(/[\u{2700}-\u{27BF}]/gu, '')
          .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
          .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
          .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
          .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
          .replace(/#\w+/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const encodedText = encodeURIComponent(`repeat after me " ${cleanText} "`);
        const audioUrl = `https://text.pollinations.ai/${encodedText}?model=openai-audio&voice=nova`;
        
        // Fetch with authorization header
        const response = await fetch(audioUrl, {
          headers: {
            'Authorization': 'Bearer diO2AcUEcZmCDP_I'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audio');
        }

        // Convert to blob and create blob URL
        const audioBlob = await response.blob();
        const blobUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        
        audio.oncanplaythrough = () => {
          setIsLoading(false);
          audio.play();
        };
        
        audio.onended = () => {
          onClose();
        };

        audio.onerror = () => {
          toast({
            title: "Audio Error",
            description: "Failed to load advanced audio. Please try again.",
            variant: "destructive",
          });
          onClose();
        };

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize advanced reader.",
          variant: "destructive",
        });
        onClose();
      }
    };

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Revoke blob URL to free memory
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
    };
  }, [text, onClose, toast]);

  const handleToggle = () => {
    if (!audioRef.current) return;
    
    if (isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-secondary p-4 animate-fade-in" style={{ boxShadow: '0 0 40px rgba(236, 72, 153, 0.6), 0 0 80px rgba(147, 51, 234, 0.4), 0 10px 30px rgba(0, 0, 0, 0.5)' }}>
      <div className="container mx-auto flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span className="text-white font-medium">
            {isLoading ? 'Loading advanced audio...' : 'Reading the text...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
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

export default AdvancedTTSPlayer;
