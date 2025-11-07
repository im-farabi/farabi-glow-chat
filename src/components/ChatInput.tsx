import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Zap, Circle, Bolt, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string, mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen') => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'fast' | 'normal' | 'super' | 'imageGen'>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message, activeMode);
    setMessage('');
    setActiveMode('chat');
    
    // Re-focus textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-2 md:p-3">
      <div className="space-y-1.5 md:space-y-2">
        {/* Mode buttons - wrap on mobile */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'fast' ? 'chat' : 'fast')}
            className={`text-xs md:text-sm ${activeMode === 'fast' ? 'bg-accent' : ''}`}
          >
            <Zap className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden sm:inline">Fast</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'normal' ? 'chat' : 'normal')}
            className={`text-xs md:text-sm ${activeMode === 'normal' ? 'bg-accent' : ''}`}
          >
            <Circle className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden sm:inline">Normal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'super' ? 'chat' : 'super')}
            className={`text-xs md:text-sm ${activeMode === 'super' ? 'bg-accent' : ''}`}
          >
            <Bolt className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold" strokeWidth={2.5} />
            <span className="hidden sm:inline">Super</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'imageGen' ? 'chat' : 'imageGen')}
            className={`text-xs md:text-sm ${activeMode === 'imageGen' ? 'bg-accent' : ''}`}
          >
            <Palette className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold" strokeWidth={2.5} />
            <span className="hidden sm:inline">Generate Image</span>
          </Button>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            autoFocus
            className="min-h-[40px] md:min-h-[50px] max-h-[120px] md:max-h-[150px] resize-none text-sm md:text-base"
          />

          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="icon"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-[40px] w-[40px] md:h-[50px] md:w-[50px] shrink-0"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {activeMode !== 'chat' && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          {activeMode === 'fast' ? (
            <>
              <Zap className="h-3 w-3 font-bold" strokeWidth={2.5} />
              <span>Fast mode active</span>
            </>
          ) : activeMode === 'normal' ? (
            <>
              <Circle className="h-3 w-3 font-bold" strokeWidth={2.5} />
              <span>Normal mode active</span>
            </>
          ) : activeMode === 'super' ? (
            <>
              <Bolt className="h-3 w-3 font-bold" strokeWidth={2.5} />
              <span>Super mode active</span>
            </>
          ) : (
            <>
              <Palette className="h-3 w-3 font-bold" strokeWidth={2.5} />
              <span>Image Generation mode active</span>
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default ChatInput;
