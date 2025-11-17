import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Bolt, Circle, Zap, X, Code2, Eye, Image as ImageIcon, Brain, Wrench } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { recommendedQuestions } from '@/data/recommendedQuestions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
interface ChatInputProps {
  onSendMessage: (message: string, mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think', image?: File) => void;
  disabled?: boolean;
}
const ChatInput = ({
  onSendMessage,
  disabled
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleFillInput = (event: CustomEvent<string>) => {
      setMessage(event.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener('fillChatInput', handleFillInput as EventListener);
    return () => window.removeEventListener('fillChatInput', handleFillInput as EventListener);
  }, []);
  const handleSend = () => {
    if (!message.trim() && !selectedImage) return;
    
    if (selectedImage) {
      console.log('🖼️ Sending message with image - AI will analyze it in', activeMode, 'mode');
    }
    
    onSendMessage(message, activeMode, selectedImage || undefined);
    setMessage('');
    // DON'T reset activeMode - keep it persistent!
    setSelectedImage(null);
    setImagePreview(null);

    // Re-focus textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }
    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };
  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
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
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowRecommended(false);
      }
    };
    if (showRecommended) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecommended]);
  return <div className="border-t border-border bg-card p-2 md:p-3">
      <div className="space-y-1.5 md:space-y-2">
        {/* Mode buttons - wrap on mobile */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveMode(activeMode === 'fast' ? 'normal' : 'fast')} className={`text-xs md:text-sm ${activeMode === 'fast' ? 'bg-accent' : ''}`}>
            <Bolt className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold text-red-500" strokeWidth={2.5} />
            <span className="hidden sm:inline">Fast</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setActiveMode(activeMode === 'normal' ? 'normal' : 'normal')} className={`text-xs md:text-sm ${activeMode === 'normal' ? 'bg-accent' : ''}`}>
            <Circle className="h-3 w-3 md:h-4 md:w-4 md:mr-1 text-yellow-500" />
            <span className="hidden sm:inline">Normal</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setActiveMode(activeMode === 'super' ? 'normal' : 'super')} className={`text-xs md:text-sm ${activeMode === 'super' ? 'bg-accent' : ''}`}>
            <Zap className="h-3 w-3 md:h-4 md:w-4 md:mr-1 font-bold text-green-500" strokeWidth={2.5} />
            <span className="hidden sm:inline">Super</span>
          </Button>
        </div>

        {/* Image Preview */}
        {selectedImage && imagePreview && <div className="relative inline-block mb-2">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border-2 border-border object-cover" />
              <Badge className="absolute top-1 left-1 text-[10px] bg-purple-500/90 text-white">
                Vision Mode
              </Badge>
            </div>
            <button onClick={clearImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-90 transition-opacity" type="button">
              <X className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedImage.name} ({(selectedImage.size / 1024).toFixed(1)} KB)
            </p>
          </div>}

        {/* Input row */}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          {/* Image Upload Button */}
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            className="h-[40px] w-[40px] md:h-[50px] md:w-[50px] shrink-0"
            title="Upload Image"
          >
            <ImageIcon className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Tool Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button"
                variant="outline" 
                size="icon" 
                className={`h-[40px] w-[40px] md:h-[50px] md:w-[50px] shrink-0 ${(activeMode === 'coder' || activeMode === 'think') ? 'bg-accent' : ''}`}
                title="Tools"
              >
                <Wrench className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border z-50">
              <DropdownMenuItem 
                onClick={() => setActiveMode(activeMode === 'coder' ? 'normal' : 'coder')}
                className={`cursor-pointer ${activeMode === 'coder' ? 'bg-accent' : ''}`}
              >
                <Code2 className="h-4 w-4 mr-2 text-blue-500" />
                <span>Coder Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveMode(activeMode === 'think' ? 'normal' : 'think')}
                className={`cursor-pointer ${activeMode === 'think' ? 'bg-accent' : ''}`}
              >
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                <span>Think Mode</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1">
            <Textarea ref={textareaRef} value={message} onChange={e => {
            setMessage(e.target.value);
            if (e.target.value.trim()) {
              setShowRecommended(false);
            }
          }} onKeyDown={handleKeyDown} onFocus={() => {
            if (!message.trim()) {
              setShowRecommended(true);
            }
          }} onClick={() => {
            if (!message.trim()) {
              setShowRecommended(true);
            }
          }} placeholder="Type your message..." autoFocus className="min-h-[40px] md:min-h-[50px] max-h-[120px] md:max-h-[150px] resize-none text-sm md:text-base" />
            
            {!isMobile && showRecommended && recommendedQuestions.length > 0 && <div ref={dropdownRef} className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                {recommendedQuestions.map((question, idx) => <button key={idx} onClick={e => {
              e.stopPropagation();
              setMessage(question);
              setShowRecommended(false);
              textareaRef.current?.focus();
            }} className="w-full text-left px-4 py-2 hover:bg-accent text-sm text-foreground transition-colors">
                    {question}
                  </button>)}
              </div>}
          </div>

          <Button onClick={handleSend} disabled={disabled || !message.trim() && !selectedImage} size="icon" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 h-[40px] w-[40px] md:h-[50px] md:w-[50px] shrink-0 transition-all duration-200 active:scale-95">
            <Send className="h-5 w-5 md:h-6 md:w-6 font-bold" strokeWidth={2.5} />
          </Button>
        </div>
        
        {/* AI disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-2">FARABI Can Make Mistakes.



      </p>
      </div>

      {activeMode !== 'normal' && <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          {activeMode === 'fast' ? <>
              <Bolt className="h-3 w-3 font-bold text-red-500" strokeWidth={2.5} />
              <span>Fast mode active</span>
            </> : activeMode === 'super' ? <>
              <Zap className="h-3 w-3 font-bold text-green-500" strokeWidth={2.5} />
              <span>Super mode active</span>
            </> : activeMode === 'coder' ? <>
              <Code2 className="h-3 w-3 text-blue-500" />
              <span>Coder mode active</span>
            </> : activeMode === 'think' ? <>
              <Brain className="h-3 w-3 text-purple-500" />
              <span>Think mode active - Deep reasoning enabled</span>
            </> : <>
              <span>Image Generation mode active</span>
            </>}
        </p>}
    </div>;
};
export default ChatInput;