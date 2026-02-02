import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Code2, 
  Sparkles, 
  Copy, 
  Check, 
  Download,
  ExternalLink,
  Zap,
  Send,
  ChevronDown,
  CheckCircle2,
  Gamepad2,
  Palette,
  FileCode,
  Wand2,
  Beaker,
  X,
  Eye,
  Globe,
  Maximize2,
  Link2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import WebGenBackground from '@/components/WebGenBackground';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

// Model icons
import gptIcon from '@/assets/gpt52-new-icon.png';
import claudeIcon from '@/assets/claude-icon.png';
import qwenIcon from '@/assets/qwen-icon.png';

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

type ModelType = 'claude' | 'gpt' | 'qwen';

interface WebGenMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'prompt' | 'options' | 'generating' | 'complete' | 'edit';
  generatedCode?: string;
  generationTime?: number;
}

interface MultiModelResult {
  model: string;
  label: string;
  success: boolean;
  code: string | null;
  time: number;
  error?: string;
}

// Multi-model streaming state
interface MultiModelStreamState {
  claude: { code: string; loading: boolean; error?: string; done: boolean };
  gpt: { code: string; loading: boolean; error?: string; done: boolean };
  qwen: { code: string; loading: boolean; error?: string; done: boolean };
}

// Model options with icons - Claude is best
const MODEL_OPTIONS = [
  { id: 'claude' as ModelType, name: 'Claude', icon: claudeIcon, best: true },
  { id: 'gpt' as ModelType, name: 'GPT 5.2', icon: gptIcon },
  { id: 'qwen' as ModelType, name: 'Qwen Coder', icon: qwenIcon }
];

// Expected generation times in milliseconds per model (based on benchmarking)
const MODEL_EXPECTED_TIMES: Record<ModelType, number> = {
  claude: 90000,   // 90 seconds (~60 tokens/sec)
  gpt: 60000,      // 60 seconds (~100 tokens/sec)
  qwen: 75000      // 75 seconds (~80 tokens/sec)
};

// Options
const THEME_OPTIONS = [
  { id: 'black-white', label: 'Black & White', recommended: true },
  { id: 'blue-black', label: 'Blue & Black' },
  { id: 'purple-black', label: 'Purple & Black' },
  { id: 'other', label: 'Other' }
];

const FONT_OPTIONS = [
  { id: 'Poppins', label: 'Poppins', recommended: true },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Rubik', label: 'Rubik' },
  { id: 'other', label: 'Other' }
];

const TYPE_OPTIONS = [
  { id: 'premium', label: 'Rich & Premium', desc: 'Luxurious, polished design', recommended: true },
  { id: 'detailed', label: 'Fully Detailed', desc: 'Complete with all features' },
  { id: 'static', label: 'Static for Testing', desc: 'Simple, fast to generate' },
  { id: 'other', label: 'Other', desc: 'Custom style' }
];

// Website Stack Options
const STACK_OPTIONS = [
  { 
    id: 'designed', 
    label: 'Designed Mode', 
    desc: 'Beautiful HTML/CSS with premium animations',
    modes: ['designed'],
    icon: Palette,
    recommended: true
  },
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
    id: 'classic', 
    label: 'Classic Mode', 
    desc: 'Traditional HTML, CSS, and vanilla JS',
    modes: ['classic'],
    icon: FileCode 
  },
  { 
    id: 'other', 
    label: 'Other', 
    desc: 'Custom approach',
    modes: [],
    icon: FileCode 
  }
];

const WebGen = () => {
  useWebGenSEO();
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  
  
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
  
  // Custom "Other" inputs
  const [customFont, setCustomFont] = useState('');
  const [customType, setCustomType] = useState('');
  const [customStack, setCustomStack] = useState('');

  // Multi-model beta state
  const [multiModelMode, setMultiModelMode] = useState(false);
  const [multiModelResults, setMultiModelResults] = useState<MultiModelResult[]>([]);
  const [multiModelBlobUrls, setMultiModelBlobUrls] = useState<Record<string, string>>({});
  const [showMultiModelComparison, setShowMultiModelComparison] = useState(false);
  
  // Multi-model streaming state
  const [multiModelStreams, setMultiModelStreams] = useState<MultiModelStreamState>({
    claude: { code: '', loading: false, done: false },
    gpt: { code: '', loading: false, done: false },
    qwen: { code: '', loading: false, done: false }
  });
  const [isMultiModelStreaming, setIsMultiModelStreaming] = useState(false);
  
  // Live preview state - using refs for latest code access
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [livePreviewModel, setLivePreviewModel] = useState<ModelType | null>(null);
  const livePreviewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePreviewIframeRef = useRef<HTMLIFrameElement>(null);
  const generatedCodeRef = useRef('');
  const multiModelStreamsRef = useRef(multiModelStreams);
  
  // Full preview state for comparison modal
  const [fullPreviewModel, setFullPreviewModel] = useState<string | null>(null);
  
  // Publish state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishSlug, setPublishSlug] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  
  
  useEffect(() => {
    multiModelStreamsRef.current = multiModelStreams;
  }, [multiModelStreams]);

  // Get modes array from selected stack
  const getSelectedModes = () => {
    if (!selectedStack) return [];
    const stack = STACK_OPTIONS.find(s => s.id === selectedStack);
    return stack?.modes || [];
  };

  // Enhance prompt using pollinations-chat
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
  const [selectedModel, setSelectedModel] = useState<ModelType>('claude');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number>(0);
  const [generationTime, setGenerationTime] = useState<number>(0);
  
  // Progress bar state
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [multiModelProgress, setMultiModelProgress] = useState<Record<ModelType, number>>({
    claude: 0,
    gpt: 0,
    qwen: 0
  });
  
  // Streaming started tracking - progress bar only starts when first content arrives
  const [streamingStarted, setStreamingStarted] = useState(false);
  const [streamingStartTime, setStreamingStartTime] = useState<number>(0);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      Object.values(multiModelBlobUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [blobUrl, multiModelBlobUrls]);

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

  // Live preview auto-refresh during streaming using contentDocument.write
  useEffect(() => {
    if (showLivePreview && loading) {
      livePreviewIntervalRef.current = setInterval(() => {
        // Use refs to get the latest code
        const currentCode = livePreviewModel 
          ? multiModelStreamsRef.current[livePreviewModel]?.code || ''
          : generatedCodeRef.current;
        
        // Update iframe content without reloading
        if (livePreviewIframeRef.current && currentCode.length > 100) {
          try {
            const doc = livePreviewIframeRef.current.contentDocument;
            if (doc) {
              doc.open();
              doc.write(currentCode);
              doc.close();
            }
          } catch (e) {
            console.error('Failed to update live preview:', e);
          }
        }
      }, 1000);  // Update every 1 second
    }
    
    return () => {
      if (livePreviewIntervalRef.current) {
        clearInterval(livePreviewIntervalRef.current);
        livePreviewIntervalRef.current = null;
      }
    };
  }, [showLivePreview, loading, livePreviewModel]);
  
  // Update preview immediately when opening
  useEffect(() => {
    if (showLivePreview) {
      const codeToPreview = livePreviewModel 
        ? multiModelStreamsRef.current[livePreviewModel]?.code || ''
        : generatedCodeRef.current;
      
      if (codeToPreview.length > 100 && livePreviewIframeRef.current) {
        try {
          const doc = livePreviewIframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(codeToPreview);
            doc.close();
          }
        } catch (e) {
          console.error('Failed to set initial preview:', e);
        }
      }
    }
  }, [showLivePreview, livePreviewModel]);

  // Progress bar calculation effect - only starts when streaming actually starts
  useEffect(() => {
    if (!loading) {
      // Reset progress when not loading
      setProgressPercentage(0);
      setMultiModelProgress({ claude: 0, gpt: 0, qwen: 0 });
      return;
    }
    
    // Don't calculate progress until streaming has started (first content received)
    if (!streamingStarted) {
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - streamingStartTime;
      
      if (isMultiModelStreaming) {
        // Update each model's progress independently
        const newProgress: Record<ModelType, number> = { claude: 0, gpt: 0, qwen: 0 };
        (['claude', 'gpt', 'qwen'] as const).forEach(model => {
          const expected = MODEL_EXPECTED_TIMES[model];
          const progress = Math.min(99, Math.floor((elapsed / expected) * 100));
          newProgress[model] = multiModelStreams[model].done ? 100 : progress;
        });
        setMultiModelProgress(newProgress);
      } else {
        // Single model progress
        const expected = MODEL_EXPECTED_TIMES[selectedModel];
        const progress = Math.min(99, Math.floor((elapsed / expected) * 100));
        setProgressPercentage(progress);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [loading, streamingStarted, streamingStartTime, selectedModel, isMultiModelStreaming, multiModelStreams]);

  // Cleanup live preview
  const closeLivePreview = useCallback(() => {
    setShowLivePreview(false);
    setLivePreviewModel(null);
    if (livePreviewIntervalRef.current) {
      clearInterval(livePreviewIntervalRef.current);
      livePreviewIntervalRef.current = null;
    }
  }, []);

  const openLivePreview = useCallback((modelKey?: ModelType) => {
    setLivePreviewModel(modelKey || null);
    setShowLivePreview(true);
  }, []);

  // Publish website handler
  const handlePublish = async () => {
    if (!publishTitle.trim() || !publishSlug.trim() || !generatedCode) {
      toast({
        title: "Missing information",
        description: "Please fill in the title and slug",
        variant: "destructive"
      });
      return;
    }
    
    setPublishing(true);
    
    try {
      const anonymousId = localStorage.getItem('anonymous_user_id') || 
        `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store if new
      if (!localStorage.getItem('anonymous_user_id')) {
        localStorage.setItem('anonymous_user_id', anonymousId);
      }
      
      const { data, error } = await supabase.functions.invoke('publish-website', {
        body: {
          title: publishTitle.trim(),
          slug: publishSlug.trim().toLowerCase(),
          html_content: generatedCode,
          anonymous_id: anonymousId
        }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        toast({
          title: "Publishing failed",
          description: data.error,
          variant: "destructive"
        });
        return;
      }
      
      setPublishedUrl(data.url);
      toast({
        title: "Published!",
        description: "Your website is now live",
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Publishing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setPublishing(false);
    }
  };
  
  const copyPublishedUrl = async () => {
    if (publishedUrl) {
      await navigator.clipboard.writeText(publishedUrl);
      toast({ title: "Copied!", description: "URL copied to clipboard" });
    }
  };
  
  const openPublishDialog = () => {
    setPublishTitle(userPrompt.slice(0, 50) || 'My Website');
    setPublishSlug('');
    setPublishedUrl(null);
    setShowPublishDialog(true);
  };

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
    // Handle theme
    let themeText = '';
    if (selectedTheme === 'black-white') {
      themeText = 'black and white minimal color scheme';
    } else if (selectedTheme === 'blue-black') {
      themeText = 'blue and black color scheme';
    } else if (selectedTheme === 'purple-black') {
      themeText = 'purple and black color scheme';
    } else {
      themeText = `custom theme: ${customTheme}`;
    }
    
    // Handle font - use custom if "other" selected
    const fontText = selectedFont === 'other' ? customFont : selectedFont;
    
    // Handle type
    let typeText = '';
    if (selectedType === 'premium') {
      typeText = 'rich, premium, luxurious design with smooth animations, gradients, and visual effects';
    } else if (selectedType === 'detailed') {
      typeText = 'fully detailed website with all features, sections, and functionality';
    } else if (selectedType === 'static') {
      typeText = 'simple static site for testing purposes, minimal but functional';
    } else {
      typeText = `custom style: ${customType}`;
    }
    
    const selectedModes = getSelectedModes();
    
    let modeText = '';
    
    // Handle custom stack
    if (selectedStack === 'other' && customStack) {
      modeText = `
CUSTOM APPROACH:
${customStack}`;
    } else if (selectedModes.includes('game')) {
      modeText = `
GAME MODE (Full-Featured):
- Include Kaboom.js, Three.js if 3D needed, GSAP for animations
- Create COMPLETE, PLAYABLE game with all logic in ONE HTML file
- Player controls, scoring system, game states (menu, playing, game over)
- Visual effects, particle animations, smooth transitions
- Include clear on-screen instructions`;
    } else if (selectedModes.includes('functional')) {
      modeText = `
FUNCTIONAL MODE (JavaScript-Heavy):
- Include Tailwind CSS and Alpine.js
- Make EVERYTHING work: buttons, forms, navigation, modals
- Proper JavaScript event handling and form validation
- Dynamic content updates and state management
- Responsive and fully interactive`;
    } else if (selectedModes.includes('designed')) {
      modeText = `
DESIGNED MODE (Premium Design):
- Include Tailwind CSS, GSAP + ScrollTrigger
- PREMIUM visual design with gradients, shadows, depth
- Smooth hover effects and CSS transitions
- Scroll-triggered reveal animations
- Professional typography and spacing
- Modern, luxurious aesthetic`;
    } else if (selectedModes.includes('classic')) {
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
- Font Family: ${fontText} (import from Google Fonts)
- Style: ${typeText}
${modeText}`;
  };

  // Multi-model streaming generation - parallel streaming to all 3 models
  const generateMultiModelStreaming = async (prompt: string) => {
    setLoading(true);
    setIsMultiModelStreaming(true);
    setMultiModelResults([]);
    setMultiModelBlobUrls({});
    setGenerationStartTime(Date.now());
    setMultiModelProgress({ claude: 0, gpt: 0, qwen: 0 });
    
    // Reset stream states
    setMultiModelStreams({
      claude: { code: '', loading: true, done: false },
      gpt: { code: '', loading: true, done: false },
      qwen: { code: '', loading: true, done: false }
    });
    
    const modelKeys = ['claude', 'gpt', 'qwen'] as const;
    const startTimes: Record<string, number> = {};
    
    // Start all 3 streams in parallel
    const promises = modelKeys.map(async (modelKey) => {
      startTimes[modelKey] = Date.now();
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-gen`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ 
              prompt: `Create a website: ${prompt}`, 
              stream: true,
              model: modelKey,
              modes: getSelectedModes()
            }),
          }
        );

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
                  // Update this model's stream state
                  setMultiModelStreams(prev => ({
                    ...prev,
                    [modelKey]: { ...prev[modelKey], code: accumulatedCode }
                  }));
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
        
        const elapsed = Date.now() - startTimes[modelKey];
        
        // Mark as done
        setMultiModelStreams(prev => ({
          ...prev,
          [modelKey]: { ...prev[modelKey], code, loading: false, done: true }
        }));
        
        return {
          model: modelKey,
          label: MODEL_OPTIONS.find(m => m.id === modelKey)?.name || modelKey,
          success: code.length > 100,
          code,
          time: elapsed
        };
      } catch (error) {
        const elapsed = Date.now() - startTimes[modelKey];
        setMultiModelStreams(prev => ({
          ...prev,
          [modelKey]: { 
            ...prev[modelKey], 
            loading: false, 
            done: true,
            error: error instanceof Error ? error.message : 'Failed' 
          }
        }));
        
        return {
          model: modelKey,
          label: MODEL_OPTIONS.find(m => m.id === modelKey)?.name || modelKey,
          success: false,
          code: null,
          time: elapsed,
          error: error instanceof Error ? error.message : 'Failed'
        };
      }
    });
    
    const results = await Promise.allSettled(promises);
    const finalResults: MultiModelResult[] = results.map(r => 
      r.status === 'fulfilled' ? r.value : {
        model: 'unknown',
        label: 'Unknown',
        success: false,
        code: null,
        time: 0,
        error: 'Promise rejected'
      }
    );
    
    setMultiModelResults(finalResults);
    
    // Create blob URLs for successful results
    const urls: Record<string, string> = {};
    finalResults.forEach(result => {
      if (result.success && result.code) {
        const blob = new Blob([result.code], { type: 'text/html' });
        urls[result.model] = URL.createObjectURL(blob);
      }
    });
    setMultiModelBlobUrls(urls);
    
    const elapsed = Date.now() - generationStartTime;
    setGenerationTime(elapsed);
    setLoading(false);
    setIsMultiModelStreaming(false);
    setShowMultiModelComparison(true);
    
    toast({
      title: "All models completed!",
      description: `Generated ${finalResults.filter(r => r.success).length}/3 websites`,
    });
  };

  // Select a result from multi-model comparison
  const selectMultiModelResult = (result: MultiModelResult) => {
    if (!result.success || !result.code) return;
    
    setGeneratedCode(result.code);
    const blob = new Blob([result.code], { type: 'text/html' });
    setBlobUrl(URL.createObjectURL(blob));
    setShowMultiModelComparison(false);
    setMultiModelMode(false);
    
    setMessages(prev => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (updated[lastIdx]?.type === 'generating') {
        updated[lastIdx] = {
          ...updated[lastIdx],
          type: 'complete',
          generatedCode: result.code!,
          generationTime: result.time
        };
      }
      return updated;
    });
    
    setCurrentStep('complete');
    
    toast({
      title: `Selected ${result.label}!`,
      description: "Your website is ready to view",
    });
  };

  const generateWebsite = async (prompt: string, isEdit: boolean = false) => {
    setLoading(true);
    setGeneratedCode('');
    setShowCode(false);
    setGenerationStartTime(Date.now());
    setProgressPercentage(0);
    setShowLivePreview(true);  // Auto-start live preview
    setStreamingStarted(false);  // Reset streaming started flag
    setStreamingStartTime(0);
    
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 90000);

    try {
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
            modes: getSelectedModes()
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
                // Track when streaming actually starts (first content received)
                if (!streamingStarted) {
                  setStreamingStarted(true);
                  setStreamingStartTime(Date.now());
                }
                accumulatedCode += parsed.content;
                setGeneratedCode(accumulatedCode);
                generatedCodeRef.current = accumulatedCode;  // Update ref for live preview
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
    
    if (multiModelMode) {
      generateMultiModelStreaming(enhancedPrompt);
    } else {
      generateWebsite(enhancedPrompt);
    }
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

  // Luxury glass card component
  const LuxuryCard = ({ 
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
        "p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 text-left",
        "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]",
        "hover:shadow-[0_0_40px_rgba(255,255,255,0.03)]",
        selected && "bg-white/[0.05] border-white/[0.15] shadow-[0_0_30px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      {children}
    </button>
  );

  // Model selector card
  const ModelCard = ({ 
    model, 
    selected, 
    onClick 
  }: { 
    model: typeof MODEL_OPTIONS[0]; 
    selected: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300",
        "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]",
        selected && "bg-white/[0.06] border-white/[0.2]"
      )}
    >
      <img src={model.icon} alt={model.name} className="w-6 h-6 rounded" />
      <span className="text-sm font-medium text-foreground">{model.name}</span>
      {model.best && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">Best</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WebGenBackground />
      <Header showTemporaryToggle={false} />
      
      {/* Multi-model comparison modal */}
      {showMultiModelComparison && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Compare Results</h2>
                <p className="text-sm text-muted-foreground">Choose your favorite version</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setShowMultiModelComparison(false);
                  setCurrentStep('options');
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Results grid */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-white/50 mx-auto" />
                    <p className="text-white/60">Generating with all 3 models...</p>
                    <p className="text-sm text-white/40">This may take up to 90 seconds</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {multiModelResults.map((result) => (
                    <div 
                      key={result.model}
                      className={cn(
                        "rounded-xl border overflow-hidden",
                        result.success 
                          ? "border-white/10 bg-white/[0.02]" 
                          : "border-destructive/20 bg-destructive/5"
                      )}
                    >
                      {/* Model header */}
                      <div className="flex items-center justify-between p-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <img 
                            src={MODEL_OPTIONS.find(m => m.id === result.model)?.icon} 
                            alt={result.label}
                            className="w-5 h-5 rounded"
                          />
                          <span className="font-medium text-foreground">{result.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.success ? `${(result.time / 1000).toFixed(1)}s` : 'Failed'}
                        </span>
                      </div>
                      
                      {/* Preview - larger 16:9 aspect */}
                      {result.success && result.code ? (
                        <>
                          <div className="aspect-video bg-white overflow-hidden relative group">
                            <iframe 
                              src={multiModelBlobUrls[result.model]}
                              className="w-full h-full border-0"
                              title={`Preview ${result.label}`}
                            />
                            {/* Full Preview button overlay */}
                            <button
                              onClick={() => setFullPreviewModel(result.model)}
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <div className="bg-white/90 text-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium">
                                <Maximize2 className="h-4 w-4" />
                                Full Preview
                              </div>
                            </button>
                          </div>
                          <div className="p-3 flex gap-2">
                            <Button 
                              onClick={() => selectMultiModelResult(result)}
                              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10"
                            >
                              Use This
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="aspect-video flex items-center justify-center text-destructive">
                          <div className="text-center p-4">
                            <p className="text-sm">{result.error || 'Generation failed'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Live Preview Dialog */}
      <Dialog open={showLivePreview} onOpenChange={(open) => !open && closeLivePreview()}>
        <DialogContent className="max-w-6xl h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
              {loading && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Auto-refreshing every 500ms)
                </span>
              )}
              {livePreviewModel && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {MODEL_OPTIONS.find(m => m.id === livePreviewModel)?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 h-full bg-white">
            <iframe 
              ref={livePreviewIframeRef}
              className="w-full h-[calc(85vh-80px)] border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Full Preview Dialog (for multi-model comparison) */}
      <Dialog open={!!fullPreviewModel} onOpenChange={(open) => !open && setFullPreviewModel(null)}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              Full Preview — {MODEL_OPTIONS.find(m => m.id === fullPreviewModel)?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 h-full bg-white">
            {fullPreviewModel && multiModelBlobUrls[fullPreviewModel] && (
              <iframe 
                src={multiModelBlobUrls[fullPreviewModel]}
                className="w-full h-[calc(95vh-80px)] border-0"
                title="Full Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Publish Your Website
            </DialogTitle>
          </DialogHeader>
          
          {!publishedUrl ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="publish-title">Title</Label>
                <Input
                  id="publish-title"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="My Awesome Website"
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Your Website URL</Label>
                <div className="flex items-center gap-0 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <span className="px-3 py-2 text-sm text-muted-foreground bg-white/5 border-r border-white/10">
                    farabi.me/site/
                  </span>
                  <Input
                    id="publish-slug"
                    value={publishSlug}
                    onChange={(e) => setPublishSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-website"
                    maxLength={50}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  3-50 characters, lowercase letters, numbers, and hyphens only
                </p>
              </div>
              
              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPublishDialog(false)}
                  className="border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing || publishSlug.length < 3 || !publishTitle.trim()}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <div className="p-4 rounded-full bg-emerald-500/10 w-fit mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Published!</h3>
                <p className="text-sm text-muted-foreground">Your website is now live</p>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-mono text-foreground break-all">{publishedUrl}</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={copyPublishedUrl}
                  className="border-white/10"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button
                  onClick={() => window.open(publishedUrl, '_blank')}
                  className="bg-white text-black hover:bg-white/90"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Site
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowPublishDialog(false)}
                className="text-muted-foreground"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            
            {/* Welcome Screen - Luxury Hero */}
            {messages.length === 0 && (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-8 max-w-4xl px-4">
                  {/* Tagline */}
                  <p className="text-lg md:text-xl text-white/40 tracking-wide">
                    Cannot code? <span className="text-white/80 font-medium">Just an Excuse!</span>
                  </p>
                  
                  {/* Main headline - static */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                    What are you gonna build next?
                  </h1>
                  
                  {/* Large premium input */}
                  <div className="relative max-w-3xl mx-auto mt-12">
                    {/* Glass input container with white border */}
                    <div className="relative backdrop-blur-sm bg-white/[0.02] border border-white/20 rounded-2xl p-6">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Design your dream website..."
                        className="w-full min-h-[120px] md:min-h-[150px] text-lg md:text-xl bg-transparent border-0 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/30"
                        rows={4}
                      />
                      
                      {/* Bottom controls */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.05]">
                        {/* Model selector */}
                        <div className="flex gap-2">
                          {MODEL_OPTIONS.map(model => (
                            <ModelCard
                              key={model.id}
                              model={model}
                              selected={selectedModel === model.id}
                              onClick={() => setSelectedModel(model.id)}
                            />
                          ))}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={enhancePrompt}
                            disabled={!inputValue.trim() || inputValue.length < 3 || isEnhancing}
                            className="gap-1.5 text-white/40 hover:text-white hover:bg-white/5"
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
                            className="gap-1.5 bg-white text-black hover:bg-white/90"
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
                    ? "bg-white text-black" 
                    : "bg-white/[0.02] backdrop-blur-sm border border-white/[0.05]"
                )}>
                  {/* User message */}
                  {msg.role === 'user' && (
                    <p>{msg.content}</p>
                  )}

                  {/* Options message - Hidden during loading to prevent double generation */}
                  {msg.type === 'options' && !loading && (
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground text-sm uppercase tracking-wide text-white/60">Theme</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {THEME_OPTIONS.map(option => (
                            <LuxuryCard 
                              key={option.id}
                              selected={selectedTheme === option.id}
                              onClick={() => setSelectedTheme(option.id)}
                              className="relative"
                            >
                              <span className="font-medium text-white/90">{option.label}</span>
                              {'recommended' in option && option.recommended && (
                                <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  REC
                                </span>
                              )}
                            </LuxuryCard>
                          ))}
                        </div>
                        {selectedTheme === 'other' && (
                          <input
                            type="text"
                            value={customTheme}
                            onChange={(e) => setCustomTheme(e.target.value)}
                            placeholder="Describe your theme..."
                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-foreground placeholder:text-white/30 focus:outline-none focus:border-white/20"
                          />
                        )}
                      </div>

                      {/* Font Selection */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground text-sm uppercase tracking-wide text-white/60">Font</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {FONT_OPTIONS.map(option => (
                            <LuxuryCard 
                              key={option.id}
                              selected={selectedFont === option.id}
                              onClick={() => setSelectedFont(option.id)}
                              className="relative"
                            >
                              <span className="font-medium text-white/90" style={{ fontFamily: option.id !== 'other' ? option.id : undefined }}>
                                {option.label}
                              </span>
                              {'recommended' in option && option.recommended && (
                                <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  REC
                                </span>
                              )}
                            </LuxuryCard>
                          ))}
                        </div>
                        {selectedFont === 'other' && (
                          <input
                            type="text"
                            value={customFont}
                            onChange={(e) => setCustomFont(e.target.value)}
                            placeholder="Enter font name (e.g., Inter, Roboto)..."
                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-foreground placeholder:text-white/30 focus:outline-none focus:border-white/20"
                          />
                        )}
                      </div>

                      {/* Website Type */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground text-sm uppercase tracking-wide text-white/60">Quality</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {TYPE_OPTIONS.map(option => (
                            <LuxuryCard 
                              key={option.id}
                              selected={selectedType === option.id}
                              onClick={() => setSelectedType(option.id)}
                              className="relative"
                            >
                              <div>
                                <p className="font-medium text-white/90">{option.label}</p>
                                <p className="text-xs text-white/40">{option.desc}</p>
                              </div>
                              {'recommended' in option && option.recommended && (
                                <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  REC
                                </span>
                              )}
                            </LuxuryCard>
                          ))}
                        </div>
                        {selectedType === 'other' && (
                          <input
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Describe your quality style..."
                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-foreground placeholder:text-white/30 focus:outline-none focus:border-white/20"
                          />
                        )}
                      </div>

                      {/* Website Stack */}
                      <div className="space-y-3">
                        <p className="font-medium text-foreground text-sm uppercase tracking-wide text-white/60">Stack</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {STACK_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const isSelected = selectedStack === option.id;
                            return (
                              <LuxuryCard 
                                key={option.id}
                                selected={isSelected}
                                onClick={() => setSelectedStack(option.id)}
                                className="relative"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isSelected ? "bg-white/10" : "bg-white/5"
                                  )}>
                                    <Icon className={cn(
                                      "h-5 w-5",
                                      isSelected ? "text-white" : "text-white/40"
                                    )} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white/90">{option.label}</p>
                                    <p className="text-xs text-white/40">{option.desc}</p>
                                  </div>
                                </div>
                                {'recommended' in option && option.recommended && (
                                  <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    REC
                                  </span>
                                )}
                              </LuxuryCard>
                            );
                          })}
                        </div>
                        {selectedStack === 'other' && (
                          <input
                            type="text"
                            value={customStack}
                            onChange={(e) => setCustomStack(e.target.value)}
                            placeholder="Describe your stack approach..."
                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-foreground placeholder:text-white/30 focus:outline-none focus:border-white/20"
                          />
                        )}
                      </div>

                      {/* Beta Multi-Model Toggle */}
                      <div className="pt-2">
                        <button
                          onClick={() => setMultiModelMode(!multiModelMode)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                            multiModelMode 
                              ? "bg-white/10 border-white/20 text-white" 
                              : "bg-transparent border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
                          )}
                        >
                          <Beaker className="h-4 w-4" />
                          <span className="text-sm font-medium">BETA: Generate with 3 Models</span>
                          {multiModelMode && <Check className="h-4 w-4 ml-1" />}
                        </button>
                        {multiModelMode && (
                          <p className="text-xs text-white/40 mt-2 ml-1">
                            Compare Claude, GPT 5.2, and Qwen Coder side by side
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button 
                        onClick={handleStartGeneration}
                        disabled={!selectedTheme || !selectedFont || !selectedType || !selectedStack || (selectedTheme === 'other' && !customTheme.trim())}
                        className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium"
                        size="lg"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        {multiModelMode ? 'Generate with 3 AI Models' : 'Generate Website'}
                      </Button>
                    </div>
                  )}

                  {/* Generating message - Single Model - Redesigned */}
                  {msg.type === 'generating' && !showMultiModelComparison && !isMultiModelStreaming && (
                    <div className="space-y-6 w-full">
                      {/* Show user's prompt */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-muted-foreground mb-1">You asked:</p>
                        <p className="text-white">{userPrompt}</p>
                      </div>
                      
                      {/* AI Response with Live Preview */}
                      <div className="space-y-4">
                        <p className="text-white/60 text-sm">Generating your website...</p>
                        
                        {/* 1280x720 Live Preview iframe - always show during loading */}
                        {loading && (
                          <div className="rounded-xl overflow-hidden border border-white/10 bg-white">
                            <div className="relative" style={{ aspectRatio: '1280/720' }}>
                              <iframe 
                                ref={livePreviewIframeRef}
                                className="w-full h-full border-0 absolute inset-0"
                                title="Live Preview"
                                sandbox="allow-scripts allow-same-origin"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Progress bar */}
                        {loading && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {progressPercentage}% complete
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {progressPercentage < 99 
                                  ? `~${Math.max(0, Math.ceil((MODEL_EXPECTED_TIMES[selectedModel] - (Date.now() - generationStartTime)) / 1000))}s remaining`
                                  : "Finishing up..."}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                        )}
                        
                        {/* Collapsible code section */}
                        <Collapsible open={showCode} onOpenChange={setShowCode}>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <Code2 className="h-4 w-4" />
                            <span>Generating Code</span>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform",
                              showCode && "rotate-180"
                            )} />
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div 
                              ref={codeContainerRef}
                              className="mt-3 max-h-[300px] overflow-y-auto rounded-lg bg-black/50 border border-white/5 p-4"
                            >
                              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-muted-foreground">
                                <code>{generatedCode}</code>
                                {loading && (
                                  <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5 align-middle" />
                                )}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  )}
                  
                  {/* Generating message - Multi-Model Streaming */}
                  {msg.type === 'generating' && isMultiModelStreaming && (
                    <div className="space-y-4">
                      <p className="text-lg text-foreground">
                        Got it! Generating with 3 AI models simultaneously...
                      </p>
                      
                      {/* 3 Side-by-side streaming panels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['claude', 'gpt', 'qwen'] as const).map((modelKey) => {
                          const stream = multiModelStreams[modelKey];
                          const modelInfo = MODEL_OPTIONS.find(m => m.id === modelKey);
                          
                          return (
                            <div 
                              key={modelKey}
                              className={cn(
                                "rounded-xl border overflow-hidden",
                                stream.error 
                                  ? "border-destructive/20 bg-destructive/5"
                                  : stream.done 
                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                    : "border-white/10 bg-white/[0.02]"
                              )}
                            >
                              {/* Model header */}
                              <div className="flex items-center justify-between p-2 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={modelInfo?.icon} 
                                    alt={modelInfo?.name}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm font-medium text-foreground">{modelInfo?.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {stream.done ? '100%' : `${multiModelProgress[modelKey]}%`}
                                </span>
                              </div>
                              
                              {/* Progress bar under header */}
                              <div className="px-2 pb-1">
                                <Progress 
                                  value={stream.done ? 100 : (multiModelProgress[modelKey] || 0)} 
                                  className="h-1"
                                />
                              </div>
                              
                              {/* Code preview */}
                              <div className="h-32 overflow-y-auto p-2 bg-black/30">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                                  <code>{stream.code.slice(-500) || (stream.loading ? 'Starting...' : '')}</code>
                                  {stream.loading && !stream.done && (
                                    <span className="inline-block w-1.5 h-3 bg-primary/50 animate-pulse ml-0.5 align-middle" />
                                  )}
                                  {stream.error && (
                                    <span className="text-destructive">{stream.error}</span>
                                  )}
                                </pre>
                              </div>
                              
                              {/* Live preview button per model */}
                              {stream.code.length > 100 && (
                                <div className="p-2 border-t border-white/5">
                                  <Button 
                                    onClick={() => openLivePreview(modelKey)}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    Live Preview
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Complete message */}
                  {msg.type === 'complete' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-lg font-bold text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                        DONE!!!
                      </div>
                      <p className="text-foreground">Click the View App button to visit your website!</p>
                      <p className="text-sm text-muted-foreground">
                        Generated in {((msg.generationTime || generationTime) / 1000).toFixed(1)} seconds
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={openInNewTab} className="bg-white text-black hover:bg-white/90">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View App
                        </Button>
                        <Button onClick={openPublishDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          <Globe className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                        <Button variant="outline" onClick={copyCode} className="border-white/10 hover:bg-white/5">
                          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                          {copied ? 'Copied' : 'Copy Code'}
                        </Button>
                        <Button variant="outline" onClick={downloadCode} className="border-white/10 hover:bg-white/5">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>

                      {/* Show code preview */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors">
                          <Code2 className="h-4 w-4" />
                          <span>View generated code</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg bg-black/50 border border-white/5 p-4">
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-white/70">
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
        
        {/* Input Area - Only show for complete step (edit mode) */}
        {currentStep === 'complete' && (
          <div className="p-4 border-t border-white/[0.05] bg-black/50 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Model selector */}
              <div className="flex gap-2">
                {MODEL_OPTIONS.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    selected={selectedModel === model.id}
                    onClick={() => setSelectedModel(model.id)}
                  />
                ))}
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Want to make changes? e.g., 'Remove the About Me button'"
                    className="w-full min-h-[56px] max-h-[200px] resize-none bg-white/[0.02] border border-white/20 pr-12 placeholder:text-white/30"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={handleEditRequest}
                  disabled={!inputValue.trim() || loading}
                  className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state during generation */}
        {currentStep === 'generating' && !showMultiModelComparison && (
          <div className="p-4 border-t border-white/[0.05] bg-black/50 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 text-white/50">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating your website...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WebGen;
