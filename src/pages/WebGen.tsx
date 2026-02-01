import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, 
  Code2, 
  Sparkles, 
  Copy, 
  Check, 
  Download,
  ExternalLink,
  Zap,
  Brain,
  Send,
  ChevronDown,
  CheckCircle2,
  Gamepad2,
  Palette,
  FileCode,
  Wand2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import WebGenBackground from '@/components/WebGenBackground';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Page SEO
const useWebGenSEO = () => {
  useEffect(() => {
    document.title = "AI Website Generator - FARABI.me | Create Stunning Websites with AI";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate beautiful, responsive websites instantly with AI. Just describe what you want and get production-ready HTML, CSS, and JavaScript code.');
    }
  }, []);
};

type ModelType = 'haiku' | 'kimi' | 'gemini';

interface WebGenMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'prompt' | 'options' | 'generating' | 'complete' | 'edit';
  generatedCode?: string;
  generationTime?: number;
}

// Rotating words for hero
const ROTATING_WORDS = ['NEXT!', 'IMAGINATION!', 'WEB!', 'FUTURE!'];

// Options
const THEME_OPTIONS = [
  { id: 'blue-black', label: 'Blue & Black' },
  { id: 'purple-black', label: 'Purple & Black' },
  { id: 'other', label: 'Other' }
];

const FONT_OPTIONS = [
  { id: 'Poppins', label: 'Poppins' },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Rubik', label: 'Rubik' }
];

const TYPE_OPTIONS = [
  { id: 'premium', label: 'Rich & Premium', desc: 'Luxurious, polished design' },
  { id: 'detailed', label: 'Fully Detailed', desc: 'Complete with all features' },
  { id: 'static', label: 'Static for Testing', desc: 'Simple, fast to generate' }
];

// Website Stack Options - Simplified to 4 clear modes
const STACK_OPTIONS = [
  { 
    id: 'game', 
    label: 'Game Mode', 
    desc: 'Games with animations, interactions & 3D',
    modes: ['game'],
    icon: Gamepad2 
  },
  { 
    id: 'functional', 
    label: 'Functional Mode', 
    desc: 'Everything works properly with JavaScript',
    modes: ['functional'],
    icon: Zap 
  },
  { 
    id: 'designed', 
    label: 'Designed Mode', 
    desc: 'Beautiful HTML/CSS with premium animations',
    modes: ['designed'],
    icon: Palette 
  },
  { 
    id: 'classic', 
    label: 'Classic Mode', 
    desc: 'Traditional HTML, CSS, and vanilla JS',
    modes: ['classic'],
    icon: FileCode 
  }
];

const WebGen = () => {
  useWebGenSEO();
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  
  // Rotating word state
  const [wordIndex, setWordIndex] = useState(0);
  
  // Rotate words every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Chat state
  const [messages, setMessages] = useState<WebGenMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<'prompt' | 'options' | 'generating' | 'complete'>('prompt');
  
  // Options state
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Get modes array from selected stack
  const getSelectedModes = () => {
    if (!selectedStack) return [];
    const stack = STACK_OPTIONS.find(s => s.id === selectedStack);
    return stack?.modes || [];
  };

  // Enhance prompt using pollinations-chat (proven pattern from ImageGen)
  const enhancePrompt = async () => {
    if (!inputValue.trim() || inputValue.length < 3) return;
    
    setIsEnhancing(true);
    try {
      const systemPrompt = `You are an expert prompt writer for AI website generators.

Rules for website prompts:
1. Start with the website type and purpose
2. Define key sections and features clearly
3. Specify visual style, colors, and mood
4. Include interactivity requirements
5. Add specific UI elements to include
6. Keep prompts 50-150 words
7. Use structured, clear language with sections

Example transformation:
"make me a game" → "Create a 2D browser-based arcade game with the following:

GAME FEATURES:
- Player character with keyboard controls (arrow keys)
- Score system displayed in top corner
- Multiple levels with increasing difficulty
- Game over and restart functionality

VISUAL STYLE:
- Retro pixel art aesthetic
- Neon color palette (cyan, pink, purple)
- Particle effects on actions
- Smooth animations

Include start screen, in-game HUD, and game over screen."

Return ONLY the enhanced prompt. No explanations, no prefixes like "Here's" or "Enhanced:".`;

      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: `Enhance this website idea into a detailed, structured prompt:\n\n"${inputValue}"`,
          model: 'gemini-3-flash',
          seed: Math.floor(Math.random() * 1000000),
          systemPrompt: systemPrompt
        }
      });

      if (error) throw error;
      
      // Clean response - remove AI filler text
      let cleaned = (data?.text || '')
        .replace(/^["']|["']$/g, '')
        .replace(/^.*?(?:Enhanced|prompt|here|Here's|Here is):\s*/im, '')
        .replace(/^(Alright|Okay|Sure|Here|Let me)[,!.\s]*/i, '')
        .trim();
      
      if (cleaned.length > 10) {
        setInputValue(cleaned);
        toast({ 
          title: "Prompt enhanced!", 
          description: "Your prompt has been optimized for better results" 
        });
      } else {
        throw new Error('Enhancement returned empty result');
      }
    } catch (error) {
      console.error('Enhance error:', error);
      toast({ 
        title: "Enhancement failed", 
        description: "Try again or proceed with your original prompt",
        variant: "destructive" 
      });
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Generation state
  const [selectedModel, setSelectedModel] = useState<ModelType>('haiku');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number>(0);
  const [generationTime, setGenerationTime] = useState<number>(0);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep]);

  // Auto-scroll code during streaming
  useEffect(() => {
    if (showCode && codeContainerRef.current && loading) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [generatedCode, showCode, loading]);

  const handleSendPrompt = () => {
    if (!inputValue.trim()) return;
    
    setUserPrompt(inputValue.trim());
    setMessages(prev => [...prev, 
      { role: 'user', content: inputValue.trim(), type: 'prompt' },
      { role: 'assistant', content: '', type: 'options' }
    ]);
    setInputValue('');
    setCurrentStep('options');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentStep === 'prompt') {
        handleSendPrompt();
      } else if (currentStep === 'complete') {
        handleEditRequest();
      }
    }
  };

  const buildEnhancedPrompt = () => {
    const themeText = selectedTheme === 'blue-black' ? 'blue and black color scheme' 
                    : selectedTheme === 'purple-black' ? 'purple and black color scheme'
                    : `custom theme: ${customTheme}`;
    
    const typeText = selectedType === 'premium' ? 'rich, premium, luxurious design with smooth animations, gradients, and visual effects'
                   : selectedType === 'detailed' ? 'fully detailed website with all features, sections, and functionality'
                   : 'simple static site for testing purposes, minimal but functional';
    
    const selectedModes = getSelectedModes();
    
    // Build mode-specific requirements based on new simplified modes
    let modeText = '';
    
    if (selectedModes.includes('game')) {
      modeText = `
GAME MODE (Full-Featured):
- Include Kaboom.js: <script src="https://unpkg.com/kaboom@3000/dist/kaboom.mjs" type="module"></script>
- Include Three.js if 3D needed: <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
- Include GSAP: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- Create COMPLETE, PLAYABLE game with all logic in ONE HTML file
- Player controls, scoring system, game states (menu, playing, game over)
- Visual effects, particle animations, smooth transitions
- Include clear on-screen instructions`;
    }
    
    if (selectedModes.includes('functional')) {
      modeText = `
FUNCTIONAL MODE (JavaScript-Heavy):
- Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Include Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
- Make EVERYTHING work: buttons, forms, navigation, modals
- Proper JavaScript event handling and form validation
- Dynamic content updates and state management
- Responsive and fully interactive`;
    }
    
    if (selectedModes.includes('designed')) {
      modeText = `
DESIGNED MODE (Premium Design):
- Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Include GSAP + ScrollTrigger: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
- PREMIUM visual design with gradients, shadows, depth
- Smooth hover effects and CSS transitions
- Scroll-triggered reveal animations
- Professional typography and spacing
- Modern, luxurious aesthetic`;
    }
    
    if (selectedModes.includes('classic')) {
      modeText = `
CLASSIC MODE (Pure Basics):
- HTML5 semantic elements only
- Custom CSS (NO frameworks)
- Vanilla JavaScript only
- Clean, traditional structure
- Responsive with media queries
- Simple, effective, and fast`;
    }

    return `${userPrompt}

DESIGN REQUIREMENTS:
- Color Theme: ${themeText}
- Font Family: ${selectedFont} (import from Google Fonts)
- Style: ${typeText}
${modeText}`;
  };

  const generateWebsite = async (prompt: string, isEdit: boolean = false) => {
    setLoading(true);
    setGeneratedCode('');
    setShowCode(false);
    setGenerationStartTime(Date.now());
    
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 90000);

    try {
      // Build prompt - for edits, include existing code and specific instructions
      const fullPrompt = isEdit 
        ? `EXISTING CODE TO EDIT:
\`\`\`html
${generatedCode}
\`\`\`

USER'S SPECIFIC REQUEST: "${prompt}"

IMPORTANT: Make ONLY the change requested above. Keep everything else EXACTLY the same - same structure, same styles, same colors, same fonts. Return the full HTML with the minimal targeted edit.`
        : `Create a website: ${prompt}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-gen`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            prompt: fullPrompt, 
            stream: true,
            model: selectedModel,
            isEdit: isEdit,
            modes: getSelectedModes()  // Pass selected modes array
          }),
          signal: abortController.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulatedCode = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedCode += parsed.content;
                setGeneratedCode(accumulatedCode);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Clean up code
      let code = accumulatedCode;
      code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!code.startsWith('<!DOCTYPE')) {
        const doctypeIndex = code.indexOf('<!DOCTYPE');
        if (doctypeIndex > 0) code = code.substring(doctypeIndex);
      }
      
      if (!code || code.trim().length < 100 || !code.includes('<!DOCTYPE')) {
        throw new Error('Generation incomplete. Please try again.');
      }
      
      setGeneratedCode(code);
      
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      
      const elapsed = Date.now() - generationStartTime;
      setGenerationTime(elapsed);
      
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.type === 'generating') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            type: 'complete',
            generatedCode: code,
            generationTime: elapsed
          };
        }
        return updated;
      });
      
      setCurrentStep('complete');
      
      toast({
        title: "Website generated!",
        description: "Your website is ready to view",
      });
    } catch (error) {
      console.error('Generation error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Generation timed out",
          description: "Try a simpler prompt or different model.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Failed to generate",
          variant: "destructive"
        });
      }
      
      // Revert to options
      setMessages(prev => prev.slice(0, -1));
      setCurrentStep('options');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleStartGeneration = () => {
    if (!selectedTheme || !selectedFont || !selectedType || !selectedStack) {
      toast({
        title: "Please select all options",
        description: "Choose a theme, font, website type, and a stack",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedTheme === 'other' && !customTheme.trim()) {
      toast({
        title: "Describe your theme",
        description: "Please enter a custom theme description",
        variant: "destructive"
      });
      return;
    }

    const enhancedPrompt = buildEnhancedPrompt();
    
    setMessages(prev => [...prev, 
      { role: 'assistant', content: '', type: 'generating' }
    ]);
    setCurrentStep('generating');
    
    generateWebsite(enhancedPrompt);
  };

  const handleEditRequest = () => {
    if (!inputValue.trim() || !generatedCode) return;
    
    const editPrompt = inputValue.trim();
    setMessages(prev => [...prev,
      { role: 'user', content: editPrompt, type: 'edit' },
      { role: 'assistant', content: '', type: 'generating' }
    ]);
    setInputValue('');
    setCurrentStep('generating');
    
    generateWebsite(editPrompt, true);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "website.html saved" });
  };

  const openInNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank');
  };

  // Glass button component
  const GlassButton = ({ 
    selected, 
    onClick, 
    children, 
    className = '' 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300",
        "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
        "hover:scale-[1.02] hover:shadow-lg text-left",
        selected && "bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WebGenBackground />
      <Header showTemporaryToggle={false} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            
            {/* Welcome Screen - Premium Hero */}
            {messages.length === 0 && (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-8 max-w-4xl px-4">
                  {/* Tagline */}
                  <p className="text-xl md:text-2xl">
                    <span className="text-muted-foreground">Cannot code? </span>
                    <span className="bg-gradient-to-r from-primary via-pink-400 to-secondary bg-clip-text text-transparent font-semibold">
                      Just an Excuse!
                    </span>
                  </p>
                  
                  {/* Main headline with rotating word */}
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                    <span className="text-foreground">Build the </span>
                    <span 
                      key={wordIndex}
                      className="inline-block bg-gradient-to-r from-primary via-pink-400 to-secondary bg-clip-text text-transparent font-black animate-fade-in"
                    >
                      {ROTATING_WORDS[wordIndex]}
                    </span>
                  </h1>
                  
                  {/* Large premium input */}
                  <div className="relative max-w-3xl mx-auto mt-12">
                    {/* Glow behind input */}
                    <div className="absolute inset-0 -m-6 bg-gradient-to-br from-primary/25 to-secondary/25 blur-3xl rounded-[2rem]" />
                    
                    {/* Glass input container */}
                    <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Design your dream website..."
                        className="w-full min-h-[120px] md:min-h-[150px] text-lg md:text-xl bg-transparent border-0 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                        rows={4}
                      />
                      
                      {/* Bottom controls */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        {/* Model selector */}
                        <div className="flex gap-2">
                          <Button
                            variant={selectedModel === 'haiku' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedModel('haiku')}
                            className={cn(
                              "gap-1.5 text-xs",
                              selectedModel === 'haiku' && "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Haiku
                          </Button>
                          <Button
                            variant={selectedModel === 'kimi' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedModel('kimi')}
                            className={cn(
                              "gap-1.5 text-xs",
                              selectedModel === 'kimi' && "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                          >
                            <Brain className="h-3.5 w-3.5" />
                            Kimi
                          </Button>
                          <Button
                            variant={selectedModel === 'gemini' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedModel('gemini')}
                            className={cn(
                              "gap-1.5 text-xs",
                              selectedModel === 'gemini' && "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                          >
                            <Zap className="h-3.5 w-3.5" />
                            Gemini
                          </Button>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={enhancePrompt}
                            disabled={!inputValue.trim() || inputValue.length < 3 || isEnhancing}
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                          >
                            {isEnhancing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                            Enhance
                          </Button>
                          <Button 
                            onClick={handleSendPrompt}
                            disabled={!inputValue.trim()}
                            className="gap-1.5 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all"
                          >
                            <Send className="h-4 w-4" />
                            Build
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "flex",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-4",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card/60 backdrop-blur-xl border border-border/50"
                )}>
                  {/* User message */}
                  {msg.role === 'user' && (
                    <p>{msg.content}</p>
                  )}

                  {/* Options message */}
                  {msg.type === 'options' && (
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground">What theme would you like?</p>
                        <div className="grid grid-cols-3 gap-3">
                          {THEME_OPTIONS.map(option => (
                            <GlassButton 
                              key={option.id}
                              selected={selectedTheme === option.id}
                              onClick={() => setSelectedTheme(option.id)}
                            >
                              <span className="font-medium text-foreground">{option.label}</span>
                            </GlassButton>
                          ))}
                        </div>
                        {selectedTheme === 'other' && (
                          <input
                            type="text"
                            value={customTheme}
                            onChange={(e) => setCustomTheme(e.target.value)}
                            placeholder="Describe your theme..."
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                          />
                        )}
                      </div>

                      {/* Font Selection */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground">Which font?</p>
                        <div className="grid grid-cols-3 gap-3">
                          {FONT_OPTIONS.map(option => (
                            <GlassButton 
                              key={option.id}
                              selected={selectedFont === option.id}
                              onClick={() => setSelectedFont(option.id)}
                            >
                              <span className="font-medium text-foreground" style={{ fontFamily: option.id }}>
                                {option.label}
                              </span>
                            </GlassButton>
                          ))}
                        </div>
                      </div>

                      {/* Website Type */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground">What kind of website?</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {TYPE_OPTIONS.map(option => (
                            <GlassButton 
                              key={option.id}
                              selected={selectedType === option.id}
                              onClick={() => setSelectedType(option.id)}
                            >
                              <div>
                                <p className="font-medium text-foreground">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.desc}</p>
                              </div>
                            </GlassButton>
                          ))}
                        </div>
                      </div>

                      {/* Website Stack (single-select) */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground">Website Stack</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {STACK_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const isSelected = selectedStack === option.id;
                            return (
                              <GlassButton 
                                key={option.id}
                                selected={isSelected}
                                onClick={() => setSelectedStack(option.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <Icon className={cn(
                                    "h-5 w-5 mt-0.5 shrink-0",
                                    isSelected ? "text-primary" : "text-muted-foreground"
                                  )} />
                                  <div>
                                    <p className="font-medium text-foreground">{option.label}</p>
                                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                                  </div>
                                </div>
                              </GlassButton>
                            );
                          })}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        onClick={handleStartGeneration}
                        disabled={!selectedTheme || !selectedFont || !selectedType || !selectedStack || (selectedTheme === 'other' && !customTheme.trim())}
                        className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all"
                        size="lg"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Website
                      </Button>
                    </div>
                  )}

                  {/* Generating message */}
                  {msg.type === 'generating' && (
                    <div className="space-y-4">
                      <p className="text-lg text-foreground">
                        Got it! I'll start creating your website. It might take a while, please wait!
                      </p>
                      
                      {loading && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Working on it...</span>
                        </div>
                      )}
                      
                      {/* Collapsible code section */}
                      <Collapsible open={showCode} onOpenChange={setShowCode}>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Code2 className="h-4 w-4" />
                          <span>Generating code...</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            showCode && "rotate-180"
                          )} />
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div 
                            ref={codeContainerRef}
                            className="mt-3 max-h-[300px] overflow-y-auto rounded-lg bg-black/50 border border-border/50 p-4"
                          >
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground/80">
                              <code>{generatedCode}</code>
                              {loading && (
                                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                              )}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Complete message */}
                  {msg.type === 'complete' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-lg font-bold text-green-500">
                        <CheckCircle2 className="h-6 w-6" />
                        DONE!!!
                      </div>
                      <p className="text-foreground">Click the View App button to visit your website!</p>
                      <p className="text-sm text-muted-foreground">
                        Generated in {((msg.generationTime || generationTime) / 1000).toFixed(1)} seconds
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={openInNewTab} className="bg-gradient-to-r from-primary to-secondary">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View App
                        </Button>
                        <Button variant="outline" onClick={copyCode}>
                          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                          {copied ? 'Copied' : 'Copy Code'}
                        </Button>
                        <Button variant="outline" onClick={downloadCode}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>

                      {/* Show code preview */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Code2 className="h-4 w-4" />
                          <span>View generated code</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg bg-black/50 border border-border/50 p-4">
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground/80">
                              <code>{msg.generatedCode || generatedCode}</code>
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        {(currentStep === 'prompt' || currentStep === 'complete') && (
          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Model selector - Haiku first */}
              <div className="flex gap-2">
                <Button
                  variant={selectedModel === 'haiku' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('haiku')}
                  className="gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Haiku
                  <span className="text-xs opacity-70">(Best)</span>
                </Button>
                <Button
                  variant={selectedModel === 'kimi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('kimi')}
                  className="gap-1"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Kimi
                </Button>
                <Button
                  variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('gemini')}
                  className="gap-1"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Gemini
                </Button>
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep === 'complete' 
                      ? "Want to make changes? e.g., 'Remove the About Me button'" 
                      : "Describe your dream website..."
                    }
                    className="w-full min-h-[56px] max-h-[200px] resize-none bg-card/50 backdrop-blur-xl border-border/50 pr-12"
                    rows={1}
                  />
                  {/* Enhance button - only show on prompt step */}
                  {currentStep === 'prompt' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={enhancePrompt}
                      disabled={!inputValue.trim() || inputValue.length < 3 || isEnhancing}
                      className="absolute right-2 bottom-2 h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Enhance prompt"
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={currentStep === 'complete' ? handleEditRequest : handleSendPrompt}
                  disabled={!inputValue.trim() || loading}
                  className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state during generation */}
        {currentStep === 'generating' && (
          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Generating your website...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WebGen;
