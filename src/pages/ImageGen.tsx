import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

const ImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateImages = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setImages([]);
    
    try {
      const baseTimestamp = Date.now();
      const styles = [
        { suffix: 'highly detailed, digital art, cinematic lighting, 8k ultra HD, masterpiece', seed: baseTimestamp + Math.floor(Math.random() * 100000) },
        { suffix: 'photorealistic style, studio lighting, professional photography, sharp focus', seed: baseTimestamp + 100000 + Math.floor(Math.random() * 100000) },
        { suffix: 'artistic illustration, vibrant colors, fantasy art style, dramatic composition', seed: baseTimestamp + 200000 + Math.floor(Math.random() * 100000) }
      ];

      const generatedImages = await Promise.all(
        styles.map(async (style) => {
          const fullPrompt = `${prompt}, ${style.suffix}`;
          const encodedPrompt = encodeURIComponent(fullPrompt);
          const cacheBuster = Math.random().toString(36).substring(7);
          return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&seed=${style.seed}&nologo=true&enhance=false&cb=${cacheBuster}`;
        })
      );

      setImages(generatedImages);
      
      toast({
        title: "Success!",
        description: "Generated 3 images with different styles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
            <Textarea
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            
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
                  Generate Images
                </>
              )}
            </Button>
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
                      {index === 0 ? 'Digital Art Style' : index === 1 ? 'Photorealistic Style' : 'Artistic Illustration'}
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
