import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RefreshCw, ArrowLeft, Edit, History, Trash2, Clock, Wand2, Sparkles, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { ImageEditor } from '@/components/ImageEditor';
import { getImageHistory, saveImageToHistory, deleteImageFromHistory, ImageHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import PremiumBackground from '@/components/PremiumBackground';

const ImageGen = () => {
  useEffect(() => {
    document.title = "AI Image Generator - Farabi's AI Chatbot | Free Image Generation";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI images from text prompts for free. Create banners, logos, and custom images using advanced AI models. No signup required.');
    }
  }, []);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string>('');
  const [currentSeed, setCurrentSeed] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [sizePreset, setSizePreset] = useState<'banner' | 'logo' | 'custom'>('banner');
  const [customWidth, setCustomWidth] = useState('1024');
  const [customHeight, setCustomHeight] = useState('1024');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(getImageHistory());
  }, []);

  const enhancePrompt = async () => {
    const trimmedPrompt = prompt.trim();
    
    if (trimmedPrompt.length < 3) {
      toast({
        title: 'Error',
        description: 'Prompt must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setStatus('Enhancing prompt...');
    try {
      const enhanced = await sendNormal(
        `CRITICAL INSTRUCTION: Respond with ONLY the enhanced image prompt. NO greetings, NO explanations, NO markdown formatting (**, etc), NO emojis, NO extra text, NO {image:...} tags whatsoever.

Task: Transform this image prompt into a detailed, vivid description with rich visual details (lighting, setting, mood, camera angle, style). Keep it under 500 characters and maintain natural language flow.

Input: "${trimmedPrompt}"

Output ONLY the enhanced prompt text (no {image:...} tags):`
      );
      
      // Clean up response: remove markdown, quotes, conversational fluff, and {image:...} tags
      let cleaned = enhanced
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^.*?(?:prompt|version|here|output):\s*/im, '') // Remove prefixes
        .replace(/[🤙💀😉👇📸✨]/g, '') // Remove emojis
        .replace(/\{image:[^}]+\}/g, '') // Remove {image:...} tags
        .trim();
      
      // Extract text between quotes if present
      const quotedMatch = cleaned.match(/"([^"]+)"/);
      if (quotedMatch) {
        cleaned = quotedMatch[1];
      }
      
      setPrompt(cleaned);
      toast({
        title: 'Prompt Enhanced!',
        description: 'Your prompt has been improved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enhance prompt',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const generateImage = async (useNewSeed = false) => {
    const trimmedPrompt = prompt.trim();
    
    if (trimmedPrompt.length < 3) {
      toast({
        title: 'Error',
        description: 'Prompt must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    if (trimmedPrompt.length > 500) {
      toast({
        title: 'Error',
        description: 'Prompt must be less than 500 characters',
        variant: 'destructive'
      });
      return;
    }

    let width = 1280;
    let height = 720;

    if (sizePreset === 'banner') {
      width = 1280;
      height = 720;
    } else if (sizePreset === 'logo') {
      width = 500;
      height = 500;
    } else {
      width = parseInt(customWidth) || 1024;
      height = parseInt(customHeight) || 1024;
    }

    setLoading(true);
    setStatus('Generating image...');

    const fetchImageAsBlob = async (url: string): Promise<string> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      // Revoke old blob URL if exists
      if (image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
      
      return URL.createObjectURL(blob);
    };
    
    try {
      const encoded = encodeURIComponent(trimmedPrompt);
      const seed = useNewSeed ? Date.now() + Math.floor(Math.random() * 1000000) : currentSeed || Date.now();
      
      if (!useNewSeed && !currentSeed) {
        setCurrentSeed(seed);
      } else if (useNewSeed) {
        setCurrentSeed(seed);
      }

      const url = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${seed}&enhance=false&nologo=true&key=plln_pk_DSf8DvxaLKn2LbP9QQAlA5hFpQGXePYiSY1AHZQn2CiKgtO7VBKQ1FNw1xCEpRYK`;
      
      const blobUrl = await fetchImageAsBlob(url);
      setImage(blobUrl);
      
      // Save to history
      saveImageToHistory({
        prompt: trimmedPrompt,
        imageUrl: blobUrl,
        sizePreset: sizePreset === 'custom' ? `${width}x${height}` : sizePreset
      });
      setHistory(getImageHistory());
      
      toast({
        title: 'Success!',
        description: 'Image generated successfully',
      });
    } catch (error) {
      // Try fallback without enhance and different seed
      try {
        const encoded = encodeURIComponent(trimmedPrompt);
        const fallbackSeed = Date.now() + Math.floor(Math.random() * 9999999);
        const fallbackUrl = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${fallbackSeed}&enhance=true&nologo=true`;
        const blobUrl = await fetchImageAsBlob(fallbackUrl);
        setImage(blobUrl);
        
        toast({
          title: 'Success!',
          description: 'Image generated successfully (fallback)',
        });
      } catch (fallbackError) {
        toast({
          title: 'Error',
          description: 'Failed to generate. Try refreshing page and editing the prompt!',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const downloadImage = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Downloaded!',
      description: 'Image saved to your downloads',
    });
  };

  const regenerateImage = () => {
    generateImage(true);
  };

  const loadFromHistory = (item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    setImage(item.imageUrl);
    if (item.sizePreset.includes('x')) {
      const [w, h] = item.sizePreset.split('x');
      setSizePreset('custom');
      setCustomWidth(w);
      setCustomHeight(h);
    } else {
      setSizePreset(item.sizePreset as 'banner' | 'logo' | 'custom');
    }
    setIsHistoryOpen(false);
    toast({
      title: 'Loaded from history',
      description: 'Image and settings restored'
    });
  };

  const deleteHistoryItem = (id: string) => {
    deleteImageFromHistory(id);
    setHistory(getImageHistory());
    toast({
      title: 'Deleted',
      description: 'History item removed'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black relative">
      <PremiumBackground />
      <div className="relative z-10">
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://farabi.me/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Image Generator",
                "item": "https://farabi.me/image-gen"
              }
            ]
          })}
        </script>
        
        <Header showTemporaryToggle={false} />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-2 border-pink-500/40 hover:border-pink-500/70 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all duration-300 group backdrop-blur-md"
                >
                  <ArrowLeft className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
                  <span className="text-gray-200 group-hover:text-white transition-colors font-semibold">Back to Chat</span>
                </button>
                <div className="space-y-4 animate-fade-in">
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 backdrop-blur-sm border-2 border-pink-500/50 mb-3 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
                    <ImageIcon className="w-14 h-14 text-pink-300" />
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                    AI Image Generator
                  </h1>
                  <p className="text-xl text-gray-200 font-medium">
                    Generate stunning AI images from your prompts
                  </p>
                </div>
              </div>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] bg-black/95 backdrop-blur-xl border-pink-500/20">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Image History</SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                      Your recent image generations
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-4 pr-4">
                      {history.length === 0 ? (
                        <Card className="bg-card/50 backdrop-blur-xl border-pink-500/20 p-8 text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                          <p className="text-muted-foreground">No history yet</p>
                        </Card>
                      ) : (
                        history.map((item, index) => (
                          <Card 
                            key={item.id} 
                            className="bg-card/60 backdrop-blur-xl border-pink-500/20 hover:border-pink-500/40 shadow-[0_4px_16px_rgba(236,72,153,0.1)] hover:shadow-[0_4px_24px_rgba(236,72,153,0.2)] p-4 space-y-3 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-2">
                                <p className="text-sm font-semibold line-clamp-2 text-foreground">{item.prompt}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 text-pink-400" />
                                  {formatDate(item.timestamp)}
                                </div>
                                <p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded inline-block">Size: {item.sizePreset}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-pink-500/10 hover:text-pink-400 transition-colors"
                                  onClick={() => loadFromHistory(item)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                                  onClick={() => deleteHistoryItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt="Generated" 
                                className="w-full h-32 object-cover rounded-lg border-2 border-pink-500/20"
                              />
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

          <Card className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-2xl border-2 border-pink-500/40 shadow-[0_8px_32px_rgba(236,72,153,0.25),0_0_60px_rgba(168,85,247,0.15)] hover:shadow-[0_12px_48px_rgba(236,72,153,0.35),0_0_80px_rgba(168,85,247,0.25)] hover:border-pink-500/60 transition-all duration-500 p-8 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-sm font-semibold text-foreground">Prompt (3-500 characters)</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all"
                disabled={loading}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {prompt.length}/500 characters
                </p>
                {prompt.length > 0 && (
                  <p className={`text-xs font-medium ${prompt.length >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {prompt.length >= 3 ? '✓ Ready' : 'Too short'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="size" className="text-sm font-semibold text-foreground">Image Size</Label>
              <Select value={sizePreset} onValueChange={(value: 'banner' | 'logo' | 'custom') => setSizePreset(value)}>
                <SelectTrigger id="size" className="bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-pink-500/20 z-50">
                  <SelectItem value="banner" className="focus:bg-pink-500/10">Banner (1280x720)</SelectItem>
                  <SelectItem value="logo" className="focus:bg-pink-500/10">Logo (500x500)</SelectItem>
                  <SelectItem value="custom" className="focus:bg-pink-500/10">Custom Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-sm font-semibold text-foreground">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="1024"
                    min="256"
                    max="2048"
                    disabled={loading}
                    className="bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm font-semibold text-foreground">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="1024"
                    min="256"
                    max="2048"
                    disabled={loading}
                    className="bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button
                onClick={enhancePrompt}
                disabled={loading}
                variant="outline"
                className="flex-1 h-14 border-2 border-purple-500/40 hover:border-purple-500/70 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all font-semibold text-base"
              >
                {loading && status.includes('Enhancing') ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    <span>Enhance Prompt</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => generateImage(false)}
                disabled={loading}
                className="flex-1 h-14 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-400 hover:via-purple-400 hover:to-pink-400 shadow-[0_8px_32px_rgba(236,72,153,0.4)] hover:shadow-[0_12px_48px_rgba(236,72,153,0.6),0_0_60px_rgba(236,72,153,0.3)] hover:scale-[1.02] transition-all font-bold text-base border-2 border-pink-400/50"
              >
                {loading && !status.includes('Enhancing') ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                    <span>Generate Image</span>
                  </>
                )}
              </Button>
            </div>
            {status && (
              <div className="flex items-center justify-center gap-2 bg-pink-500/10 backdrop-blur-sm border border-pink-500/20 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
                <p className="text-sm font-medium text-pink-400">{status}</p>
              </div>
            )}
          </Card>

          {image && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Card className="lg:col-span-2 overflow-hidden bg-card/60 backdrop-blur-xl border-pink-500/20 shadow-[0_8px_32px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_48px_rgba(236,72,153,0.25)] transition-all duration-300">
                <div className="aspect-video relative group">
                  <img
                    src={image}
                    alt={prompt ? `AI generated image: ${prompt.slice(0, 100)}` : "AI generated image"}
                    className="w-full h-full object-contain bg-black/50 transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Card>
              
              <Card className="p-6 bg-card/50 backdrop-blur-xl border-pink-500/20 shadow-[0_8px_32px_rgba(236,72,153,0.15)] flex flex-col gap-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Actions</h3>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-all"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => setIsEditorOpen(true)}
                  className="w-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/30 hover:border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all"
                >
                  <Edit className="mr-2 h-4 w-4 text-pink-500" />
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-semibold">
                    Edit
                  </span>
                </Button>
                <Button
                  onClick={regenerateImage}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regen
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground bg-muted/30 backdrop-blur-sm border border-border/30 rounded-lg p-3 leading-relaxed">
                  Use Regen to generate a new variation with a different seed
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>
      </div>

      {image && (
        <ImageEditor 
          image={image}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={(editedImage) => {
            setImage(editedImage);
          }}
        />
      )}
    </div>
  );
};

export default ImageGen;
