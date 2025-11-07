import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { sendNormal } from '@/lib/api';

const ImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState('');

  const generateImages = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setImages([]);
    setStatus('Enhancing prompt (1/3)...');

    const preloadImage = (url: string) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
      });
    
    try {
      let currentBase = prompt.trim();

      for (let i = 1; i <= 3; i++) {
        setStatus(`Enhancing prompt (${i}/3)...`);
        const enhancementInstruction = `You are a prompt enhancement expert. Transform the following simple image description into a detailed, cinematic prompt with rich visual details. Include:
- Specific physical descriptions (eyes, hair, clothing, etc.)
- Setting and atmosphere details
- Lighting and time of day
- Camera angle/perspective
- Artistic style (hyper-realistic, cinematic, etc.)
- Emotional tone and mood

User's simple prompt: "${currentBase}"

Return ONLY the enhanced prompt, nothing else. Make it 2-3 sentences maximum.`;

        const enhancedPrompt = (await sendNormal(enhancementInstruction)).trim();

        setStatus(`Generating image ${i}/3...`);

        let finalUrl = '';
        for (let attempt = 0; attempt < 2; attempt++) {
          const seed = Date.now() + i * 100000 + Math.floor(Math.random() * 100000);
          const cb = Math.random().toString(36).slice(2);
          const encoded = encodeURIComponent(enhancedPrompt);
          const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true&enhance=false&cb=${cb}`;
          try {
            finalUrl = await preloadImage(url);
            break;
          } catch {
            // retry
          }
        }

        if (finalUrl) {
          setImages((prev) => [...prev, finalUrl]);
        } else {
          toast({
            title: `Image ${i} failed`,
            description: 'Could not load generated image. Please try again.',
            variant: 'destructive'
          });
        }

        currentBase = enhancedPrompt; // progressively enhance for next round
      }
      
      toast({
        title: 'Success!',
        description: 'Generated up to 3 progressively enhanced images',
      });
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
