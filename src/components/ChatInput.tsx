import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, Send, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string, mode: 'chat' | 'webSearch' | 'reasoning' | 'imageGen', image?: File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'chat' | 'webSearch' | 'reasoning' | 'imageGen'>('chat');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedImage) return;
    
    onSendMessage(message, activeMode, selectedImage || undefined);
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setActiveMode('chat');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4">
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-16 md:h-20 rounded-lg border border-border"
          />
          <button
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-2">
        {/* Mode buttons - wrap on mobile */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'webSearch' ? 'chat' : 'webSearch')}
            className={`text-xs md:text-sm ${activeMode === 'webSearch' ? 'bg-accent' : ''}`}
          >
            <Search className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden sm:inline">Web Search</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'reasoning' ? 'chat' : 'reasoning')}
            className={`text-xs md:text-sm ${activeMode === 'reasoning' ? 'bg-accent' : ''}`}
          >
            <span className="text-base md:text-lg">🧠</span>
            <span className="hidden sm:inline ml-1">Reasoning</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(activeMode === 'imageGen' ? 'chat' : 'imageGen')}
            className={`text-xs md:text-sm ${activeMode === 'imageGen' ? 'bg-accent' : ''}`}
          >
            <span className="text-base md:text-lg">🎨</span>
            <span className="hidden sm:inline ml-1">Generate Image</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-2 md:px-3"
          >
            <Image className="h-3 w-3 md:h-4 md:w-4" />
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
            disabled={disabled}
            className="min-h-[50px] md:min-h-[60px] max-h-[150px] md:max-h-[200px] resize-none text-sm md:text-base"
          />

          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && !selectedImage)}
            size="icon"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-[50px] w-[50px] md:h-[60px] md:w-[60px] shrink-0"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {activeMode !== 'chat' && (
        <p className="mt-2 text-xs text-muted-foreground">
          {activeMode === 'webSearch' 
            ? '🔍 Web Search mode active' 
            : activeMode === 'reasoning' 
            ? '🧠 Reasoning mode active'
            : '🎨 Image Generation mode active'}
        </p>
      )}
    </div>
  );
};

export default ChatInput;
