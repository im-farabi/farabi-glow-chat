import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, Download, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PremiumBackground from "@/components/PremiumBackground";
import { Skeleton } from "@/components/ui/skeleton";

const sizes = [
  { value: "512x512", label: "512×512 (Square)", width: 512, height: 512 },
  { value: "768x768", label: "768×768 (Square)", width: 768, height: 768 },
  { value: "1024x1024", label: "1024×1024 (HD Square)", width: 1024, height: 1024 },
  { value: "1024x768", label: "1024×768 (Landscape)", width: 1024, height: 768 },
  { value: "768x1024", label: "768×1024 (Portrait)", width: 768, height: 1024 },
];

const NewImage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [seed, setSeed] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setLastPrompt(prompt.trim());

    const selectedSize = sizes.find(s => s.value === size);
    
    try {
      const { data, error } = await supabase.functions.invoke("pollinations-image-v2", {
        body: {
          prompt: prompt.trim(),
          width: selectedSize?.width || 1024,
          height: selectedSize?.height || 1024,
          seed: seed ? parseInt(seed) : undefined,
        }
      });

      if (error) throw error;

      const imageUrl = data.imageUrl || data.data?.[0]?.url;
      if (imageUrl) {
        // Handle base64 or URL
        if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
          setGeneratedImage(imageUrl);
        } else {
          // Assume it's base64 without prefix
          setGeneratedImage(`data:image/png;base64,${imageUrl}`);
        }
      } else {
        throw new Error("No image returned");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    // Generate with new random seed
    setSeed("");
    handleGenerate();
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: "Image saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/new")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <span className="font-semibold">AI Image</span>
              <p className="text-xs text-muted-foreground">GPT Image 1.5</p>
            </div>
          </div>
          <div className="w-16" />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label>Describe your image</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="A futuristic city at night, neon lights reflecting on wet streets, cyberpunk aesthetic..."
                className="min-h-[100px] resize-none bg-card/50 border-border/50"
                disabled={isLoading}
              />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={size} onValueChange={setSize} disabled={isLoading}>
                  <SelectTrigger className="bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seed (optional)</Label>
                <Input
                  type="number"
                  placeholder="Random"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="bg-card/50 border-border/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-12 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            {/* Result Area */}
            {(isLoading || generatedImage) && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/30">
                  {isLoading ? (
                    <div className="aspect-square">
                      <Skeleton className="w-full h-full" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
                        <p className="text-muted-foreground">Creating your masterpiece...</p>
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-auto"
                    />
                  ) : null}
                </div>

                {generatedImage && !isLoading && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handleRegenerate}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                )}

                {lastPrompt && !isLoading && (
                  <p className="text-sm text-muted-foreground text-center">
                    "{lastPrompt}"
                  </p>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !generatedImage && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create Stunning Images</h3>
                <p className="text-muted-foreground max-w-sm">
                  Describe what you want to see and let AI bring it to life. Be detailed for best results!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewImage;
