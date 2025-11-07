import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bolt, Circle, Zap, Wrench, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { recommendedQuestions } from '@/data/recommendedQuestions';
import { sendNormal } from '@/lib/api';

interface ChatInputProps {
  onSendMessage: (message: string, mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen') => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'fast' | 'normal' | 'super' | 'imageGen'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message, activeMode);
    setMessage('');
    setActiveMode('normal');
    
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

  const enhancePrompt = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error('Message must be at least 3 characters');
      return;
    }

    setEnhancing(true);
    try {
      const enhanced = await sendNormal(
        `CRITICAL INSTRUCTION: Respond with ONLY the enhanced prompt. NO greetings, NO explanations, NO markdown formatting (**, etc), NO emojis, NO extra text.

Task: Enhance this message to be more clear, detailed, and effective while maintaining the user's intent. Keep it natural and conversational.

Input: "${trimmed}"

Output ONLY the enhanced text:`
      );
      
      let cleaned = enhanced
        .replace(/\*\*/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^.*?(?:prompt|version|here|output):\s*/im, '')
        .replace(/[🤙💀😉👇📸✨]/g, '')
        .trim();
      
      const quotedMatch = cleaned.match(/"([^"]+)"/);
      if (quotedMatch) {
        cleaned = quotedMatch[1];
      }
      
      setMessage(cleaned);
      toast.success('Prompt enhanced!');
    } catch (error) {
      toast.error('Failed to enhance prompt');
    } finally {
      setEnhancing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowRecommended(false);
    if (showRecommended) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showRecommended]);

  return (
    <div className="border-t border-border bg-card p-2 md:p-3">
      <div className="space-y-1.5 md:space-y-2">
        {/* Mode buttons - wrap on mobile */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'fast' ? 'normal' : 'fast')}
            className={`text-xs md:text-sm ${activeMode === 'fast' ? 'bg-accent' : ''}`}
          >
            <Bolt className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold text-red-500" strokeWidth={2.5} />
            <span className="hidden sm:inline">Fast</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'normal' ? 'normal' : 'normal')}
            className={`text-xs md:text-sm ${activeMode === 'normal' ? 'bg-accent' : ''}`}
          >
            <Circle className="h-3 w-3 md:h-4 md:w-4 md:mr-1 text-yellow-500" />
            <span className="hidden sm:inline">Normal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'super' ? 'normal' : 'super')}
            className={`text-xs md:text-sm ${activeMode === 'super' ? 'bg-accent' : ''}`}
          >
            <Zap className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold text-green-500" strokeWidth={2.5} />
            <span className="hidden sm:inline">Super</span>
          </Button>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-[40px] w-[40px] md:h-[50px] md:w-[50px] shrink-0"
              >
                <Wrench className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              <DropdownMenuItem onClick={enhancePrompt} disabled={enhancing || !message.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                {enhancing ? 'Enhancing...' : 'Enhance Prompt'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveMode('imageGen')}>
                Generate Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) {
                  setShowRecommended(false);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                if (!message.trim()) {
                  setShowRecommended(true);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type your message..."
              autoFocus
              className="min-h-[40px] md:min-h-[50px] max-h-[120px] md:max-h-[150px] resize-none text-sm md:text-base"
            />
            
            {showRecommended && recommendedQuestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                {recommendedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMessage(question);
                      setShowRecommended(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-accent text-sm text-foreground transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

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

      {activeMode !== 'normal' && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          {activeMode === 'fast' ? (
            <>
              <Bolt className="h-3 w-3 font-bold text-red-500" strokeWidth={2.5} />
              <span>Fast mode active</span>
            </>
          ) : activeMode === 'super' ? (
            <>
              <Zap className="h-3 w-3 font-bold text-green-500" strokeWidth={2.5} />
              <span>Super mode active</span>
            </>
          ) : (
            <>
              <span>Image Generation mode active</span>
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default ChatInput;
