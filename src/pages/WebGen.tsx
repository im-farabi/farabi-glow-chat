import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Code2, 
  Eye, 
  Sparkles, 
  ArrowLeft, 
  Copy, 
  Check, 
  Download,
  ExternalLink,
  Wand2,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PremiumBackground from '@/components/PremiumBackground';
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

const LOADING_MESSAGES = [
  'Connecting to GPT-5.2...',
  'Analyzing your request...',
  'Designing layout structure...',
  'Generating HTML skeleton...',
  'Styling with CSS magic...',
  'Adding responsive design...',
  'Implementing animations...',
  'Writing JavaScript logic...',
  'Polishing the details...',
  'Almost there...',
];

const WebGen = () => {
  useWebGenSEO();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Loading message animation
  useEffect(() => {
    if (!loading) return;
    
    let messageIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [loading]);

  const generateWebsite = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the website you want to create",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setGeneratedCode('');
    
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-gen`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ prompt: prompt.trim(), stream: true })
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
                setGeneratedCode(accumulatedCode);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Clean up markdown wrappers
      let code = accumulatedCode;
      code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!code.startsWith('<!DOCTYPE')) {
        const doctypeIndex = code.indexOf('<!DOCTYPE');
        if (doctypeIndex > 0) {
          code = code.substring(doctypeIndex);
        }
      }
      
      setGeneratedCode(code);
      
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      
      setActiveTab('preview');
      
      toast({
        title: "Website generated!",
        description: "Your website is ready to preview",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate website",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code",
        variant: "destructive"
      });
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
    
    toast({
      title: "Downloaded!",
      description: "website.html saved to your device",
    });
  };

  const openInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      
      <Header showTemporaryToggle={false} />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {/* Header Section */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              AI Website Generator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Describe your dream website and let GPT-5.2 build it for you
          </p>
        </div>

        {/* Main 3-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          
          {/* Panel 1: Prompt Input */}
          <Card className="lg:col-span-4 bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5 text-primary" />
                Describe Your Website
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Textarea
                placeholder="Create a modern portfolio website for a photographer with a dark theme, image gallery, about section, and contact form..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 min-h-[200px] resize-none bg-background/50 border-border/50"
              />
              
              <Button
                onClick={generateWebsite}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all h-12"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Website
                  </>
                )}
              </Button>

              {/* Example prompts */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Landing page for a SaaS product",
                    "Portfolio for a designer",
                    "Restaurant menu page",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel 2 & 3: Preview and Code (Tabbed on mobile, side-by-side on desktop) */}
          <Card className="lg:col-span-8 bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')} className="flex-1 flex flex-col">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-background/50">
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Live Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                  </TabsList>
                  
                  {generatedCode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCode}
                        className="gap-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCode}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      {blobUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openInNewTab}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-4 overflow-hidden">
                <TabsContent value="preview" className="h-full m-0">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 bg-background/30 rounded-lg border border-border/50">
                      {/* Animated loading screen */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium text-foreground">{loadingMessage}</p>
                        <p className="text-sm text-muted-foreground">This may take up to 2 minutes for complex websites</p>
                      </div>
                      {/* Progress dots */}
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : blobUrl ? (
                    <div className="h-full rounded-lg overflow-hidden border border-border/50 bg-white">
                      <iframe
                        ref={iframeRef}
                        src={blobUrl}
                        className="w-full h-full"
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 bg-background/30 rounded-lg border border-border/50 border-dashed">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Globe className="h-12 w-12 text-primary/50" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium text-muted-foreground">No preview yet</p>
                        <p className="text-sm text-muted-foreground">Describe your website and click Generate</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="code" className="h-full m-0">
                  {generatedCode ? (
                    <div className="h-full overflow-auto rounded-lg bg-background/80 border border-border/50">
                      <pre className="p-4 text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 bg-background/30 rounded-lg border border-border/50 border-dashed">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Code2 className="h-12 w-12 text-primary/50" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium text-muted-foreground">No code yet</p>
                        <p className="text-sm text-muted-foreground">Generate a website to see the code</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WebGen;
