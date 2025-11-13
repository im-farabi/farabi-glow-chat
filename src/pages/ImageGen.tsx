import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, Download, RefreshCw, ArrowLeft, Edit, History, Trash2, Clock } from 'lucide-react';
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
  const [enhancing, setEnhancing] = useState(false);
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

    setEnhancing(true);
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
      setEnhancing(false);
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
    <div className="flex flex-col h-screen bg-background">
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
      
      <Header />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Image Generator
                  </h1>
                  <p className="text-muted-foreground">
                    Generate AI images from your prompts
                  </p>
                </div>
              </div>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <History className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Image History</SheetTitle>
                    <SheetDescription>
                      Your recent image generations
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-4 pr-4">
                      {history.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No history yet</p>
                      ) : (
                        history.map((item) => (
                          <Card key={item.id} className="p-4 space-y-3 hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-2">
                                <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(item.timestamp)}
                                </div>
                                <p className="text-xs text-muted-foreground">Size: {item.sizePreset}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => loadFromHistory(item)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
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
                                className="w-full h-32 object-cover rounded border"
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
          </div>

          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt (3-500 characters)</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={loading}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {prompt.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Image Size</Label>
              <Select value={sizePreset} onValueChange={(value: 'banner' | 'logo' | 'custom') => setSizePreset(value)}>
                <SelectTrigger id="size" className="bg-background">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="banner">Banner (1280x720)</SelectItem>
                  <SelectItem value="logo">Logo (500x500)</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="1024"
                    min="256"
                    max="2048"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="1024"
                    min="256"
                    max="2048"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={enhancePrompt}
                disabled={loading || enhancing}
                variant="outline"
                className="flex-1"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance Prompt
                  </>
                )}
              </Button>
              <Button
                onClick={() => generateImage(false)}
                disabled={loading || enhancing}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
            {status && (
              <p className="mt-2 text-sm text-muted-foreground text-center">{status}</p>
            )}
          </Card>

          {image && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 overflow-hidden bg-card border-border">
                <div className="aspect-video relative">
                  <img
                    src={image}
                    alt={prompt ? `AI generated image: ${prompt.slice(0, 100)}` : "AI generated image"}
                    className="w-full h-full object-contain bg-muted"
                    loading="lazy"
                  />
                </div>
              </Card>
              
              <Card className="p-6 bg-card border-border flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Actions</h3>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => setIsEditorOpen(true)}
                  variant="outline"
                  className="w-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20"
                  style={{
                    textShadow: '0 0 10px rgba(236, 72, 153, 0.3)',
                  }}
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
                  className="w-full"
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
                <p className="text-xs text-muted-foreground mt-2">
                  Use Regen to generate a new variation with a different seed
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>

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
