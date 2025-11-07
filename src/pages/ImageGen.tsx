import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const ImageGen = () => {
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
  const navigate = useNavigate();

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
        `CRITICAL INSTRUCTION: Respond with ONLY the enhanced image prompt. NO greetings, NO explanations, NO markdown formatting (**, etc), NO emojis, NO extra text whatsoever.

Task: Transform this image prompt into a detailed, vivid description with rich visual details (lighting, setting, mood, camera angle, style). Keep it under 500 characters and maintain natural language flow.

Input: "${trimmedPrompt}"

Output ONLY the enhanced prompt text:`
      );
      
      // Clean up response: remove markdown, quotes, and conversational fluff
      let cleaned = enhanced
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^.*?(?:prompt|version|here|output):\s*/im, '') // Remove prefixes
        .replace(/[🤙💀😉👇📸✨]/g, '') // Remove emojis
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

    const preloadImage = (url: string) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
      });
    
    try {
      const encoded = encodeURIComponent(trimmedPrompt);
      const seed = useNewSeed ? Date.now() + Math.floor(Math.random() * 1000000) : currentSeed || Date.now();
      
      if (!useNewSeed && !currentSeed) {
        setCurrentSeed(seed);
      } else if (useNewSeed) {
        setCurrentSeed(seed);
      }

      const url = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${seed}&enhance=false&nologo=true&key=plln_pk_DSf8DvxaLKn2LbP9QQAlA5hFpQGXePYiSY1AHZQn2CiKgtO7VBKQ1FNw1xCEpRYK`;
      
      const imageUrl = await preloadImage(url);
      setImage(imageUrl);
      
      toast({
        title: 'Success!',
        description: 'Image generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive'
      });
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
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
                    alt="Generated image"
                    className="w-full h-full object-contain bg-muted"
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
    </div>
  );
};

export default ImageGen;
