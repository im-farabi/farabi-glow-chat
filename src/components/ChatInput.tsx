import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Rocket, Scale, Sparkles, X, Code2, Eye, Image as ImageIcon, Brain, Wrench, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import gpt52Icon from '@/assets/gpt52-icon.png';

type ChatMode = 'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think' | 'giyaatFast' | 'giyaatMid' | 'giyaatLarge' | 'gpt52' | 'step';

interface ChatInputProps {
  onSendMessage: (message: string, mode: ChatMode, image?: File) => void;
  disabled?: boolean;
  className?: string;
}

const ChatInput = ({ onSendMessage, disabled, className }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<ChatMode>('normal');
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
    
    // Warn users about long prompts in GIYAAT mode
    if (activeMode.startsWith('giyaat') && message.length > 2000) {
      toast({
        title: "Long prompt detected",
        description: "For best results with code generation, try 'Coder' mode instead.",
      });
    }
    
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
    <div className={`p-4 md:p-6 ${className || ''}`}>
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
              <Textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message FARABI..." className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base min-h-[80px] max-h-[200px] px-4 py-3" disabled={disabled} rows={isMobile ? 2 : 1} />
            </div>
            <Button 
              onClick={handleSend} 
              disabled={disabled || (!message.trim() && !selectedImage)} 
              className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-secondary to-purple-600 hover:shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all font-bold border-2 border-white/20 active:scale-95 active:rotate-12 active:shadow-[0_0_30px_rgba(236,72,153,0.8)] shrink-0" 
              size="icon"
            >
              <Send className="h-6 w-6 drop-shadow-lg" />
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 hover:bg-accent/50 ${activeMode.startsWith('giyaat') ? 'text-orange-500 bg-orange-500/10' : ''} ${activeMode === 'gpt52' ? 'text-emerald-500 bg-emerald-500/10' : ''} ${activeMode === 'step' ? 'text-sky-500 bg-sky-500/10' : ''}`}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setActiveMode('coder')} className={activeMode === 'coder' ? 'bg-accent' : ''}>
                    <Code2 className="h-4 w-4 mr-2" />Coder Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveMode('think')} className={activeMode === 'think' ? 'bg-accent' : ''}>
                    <Brain className="h-4 w-4 mr-2" />Deep Thinker
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveMode('gpt52')} className={activeMode === 'gpt52' ? 'bg-emerald-500/20' : ''}>
                    <img src={gpt52Icon} alt="Claude 4.5" className="h-4 w-4 mr-2" />
                    <span className="font-medium">Claude 4.5</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={activeMode.startsWith('giyaat') ? 'bg-orange-500/20' : ''}>
                      <span className="font-bold text-orange-500 mr-2">G</span>
                      GIYAAT AI
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-40">
                        <DropdownMenuItem onClick={() => setActiveMode('giyaatFast')} className={activeMode === 'giyaatFast' ? 'bg-orange-500/20' : ''}>
                          <Zap className="h-4 w-4 mr-2 text-orange-500" />Fast
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveMode('giyaatMid')} className={activeMode === 'giyaatMid' ? 'bg-orange-500/20' : ''}>
                          <span className="font-bold text-orange-500 mr-2 w-4 text-center">M</span>Mid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveMode('giyaatLarge')} className={activeMode === 'giyaatLarge' ? 'bg-orange-500/20' : ''}>
                          <Rocket className="h-4 w-4 mr-2 text-orange-500" />Large
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button variant={activeMode === 'fast' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('fast')} className={`h-9 px-2 md:px-4 shrink-0 ${activeMode === 'fast' ? 'bg-primary text-primary-foreground glow-pink shadow-lg' : 'hover:bg-accent/50'}`}>
                <Rocket className="h-4 w-4 mr-1.5" /><span className="text-sm font-semibold hidden sm:inline">Quick</span>
              </Button>
              <Button variant={activeMode === 'normal' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('normal')} className={`h-9 px-2 md:px-4 shrink-0 ${activeMode === 'normal' ? 'bg-primary text-primary-foreground glow-pink shadow-lg' : 'hover:bg-accent/50'}`}>
                <Scale className="h-4 w-4 mr-1.5" /><span className="text-sm font-semibold hidden sm:inline">Balanced</span>
              </Button>
              <Button variant={activeMode === 'super' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveMode('super')} className={`h-9 px-2 md:px-4 shrink-0 ${activeMode === 'super' ? 'bg-gradient-to-r from-primary to-secondary text-white glow-pink shadow-xl' : 'hover:bg-accent/50'}`}>
                <Sparkles className="h-4 w-4 mr-1.5" /><span className="text-sm font-semibold hidden sm:inline">Deep</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
