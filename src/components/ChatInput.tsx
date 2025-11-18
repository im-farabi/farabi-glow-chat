import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bolt, Circle, Zap, X, Code2, Eye, Image as ImageIcon, Brain, Wrench } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think', image?: File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think'>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
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
    onSendMessage(message, activeMode, selectedImage || undefined);
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select a valid image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image size must be less than 10MB", variant: "destructive" });
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-[900px] mx-auto">
        <div className="floating-input space-y-4">
          {imagePreview && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                <img src={imagePreview} alt="Selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedImage?.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Eye className="h-3 w-3" />Vision Mode - AI will analyze this image
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearImage} className="flex-shrink-0 hover:bg-destructive/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message FARABI..." className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base min-h-[80px] max-h-[200px] p-0" disabled={disabled} rows={isMobile ? 2 : 1} />
            </div>
            <Button onClick={handleSend} disabled={disabled || (!message.trim() && !selectedImage)} className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 transition-all shrink-0 shadow-lg" size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 hover:bg-accent/50">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50"><Wrench className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setActiveMode('coder')} className={activeMode === 'coder' ? 'bg-accent' : ''}>
                    <Code2 className="h-4 w-4 mr-2" />Coder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveMode('think')} className={activeMode === 'think' ? 'bg-accent' : ''}>
                    <Brain className="h-4 w-4 mr-2" />Think
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={activeMode === 'fast' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('fast')} className={`h-8 px-3 ${activeMode === 'fast' ? 'bg-primary text-primary-foreground glow-cyan' : 'hover:bg-accent/50'}`}>
                <Bolt className="h-3 w-3 mr-1" /><span className="text-xs">Fast</span>
              </Button>
              <Button variant={activeMode === 'normal' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('normal')} className={`h-8 px-3 ${activeMode === 'normal' ? 'bg-primary text-primary-foreground glow-cyan' : 'hover:bg-accent/50'}`}>
                <Circle className="h-3 w-3 mr-1" /><span className="text-xs">Normal</span>
              </Button>
              <Button variant={activeMode === 'super' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('super')} className={`h-8 px-3 ${activeMode === 'super' ? 'bg-secondary text-secondary-foreground glow-purple' : 'hover:bg-accent/50'}`}>
                <Zap className="h-3 w-3 mr-1" /><span className="text-xs">Super</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
