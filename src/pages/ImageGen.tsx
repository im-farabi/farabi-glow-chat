import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [sizePreset, setSizePreset] = useState<'banner' | 'logo' | 'custom'>('banner');
  const [customWidth, setCustomWidth] = useState('1024');
  const [customHeight, setCustomHeight] = useState('1024');

  const generateImages = async () => {
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
    setImages([]);
    setStatus('Generating 3 images...');

    const preloadImage = (url: string) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
      });
    
    try {
      const encoded = encodeURIComponent(trimmedPrompt);
      
      const imagePromises = [1, 2, 3].map(async (index) => {
        const seed = Date.now() + index * 100000 + Math.floor(Math.random() * 100000);
        const url = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${seed}&enhance=false&nologo=true&key=plln_pk_DSf8DvxaLKn2LbP9QQAlA5hFpQGXePYiSY1AHZQn2CiKgtO7VBKQ1FNw1xCEpRYK`;
        
        try {
          return await preloadImage(url);
        } catch {
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      const successfulImages = results.filter((url): url is string => url !== null);
      
      setImages(successfulImages);
      
      if (successfulImages.length > 0) {
        toast({
          title: 'Success!',
          description: `Generated ${successfulImages.length} image${successfulImages.length > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate images. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate images',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Image Generator
            </h1>
            <p className="text-muted-foreground">
              Generate 3 unique images with different artistic styles from your prompt
            </p>
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
            
            <Button
              onClick={generateImages}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate 3 Images
                </>
              )}
            </Button>
            {status && (
              <p className="mt-2 text-sm text-muted-foreground text-center">{status}</p>
            )}
          </Card>

          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <Card key={index} className="overflow-hidden bg-card border-border">
                  <div className="aspect-square relative">
                    <img
                      src={image}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Image {index + 1}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageGen;
