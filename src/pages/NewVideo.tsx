import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Download, Loader2, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PremiumBackground from "@/components/PremiumBackground";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const durations = [
  { value: "4", label: "4 seconds" },
  { value: "6", label: "6 seconds" },
  { value: "8", label: "8 seconds" },
];

const aspectRatios = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "1:1", label: "1:1 (Square)" },
];

const NewVideo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("6");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [seed, setSeed] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setLastPrompt(prompt.trim());
    setGeneratedVideo(null);

    try {
      const { data, error } = await supabase.functions.invoke("pollinations-video", {
        body: {
          prompt: prompt.trim(),
          duration: parseInt(duration),
          aspectRatio,
          seed: seed ? parseInt(seed) : undefined,
        }
      });

      if (error) throw error;

      const videoUrl = data.videoUrl || data.data?.[0]?.url;
      if (videoUrl) {
        setGeneratedVideo(videoUrl);
      } else {
        throw new Error("No video returned");
      }
    } catch (error) {
      console.error("Video generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setSeed("");
    handleGenerate();
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: "Video saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download video.",
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <span className="font-semibold">AI Video</span>
              <p className="text-xs text-muted-foreground">Veo 3.1 Fast</p>
            </div>
          </div>
          <div className="w-16" />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Experimental Warning */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                Video generation is experimental. Results may vary and generation can take up to a minute.
              </AlertDescription>
            </Alert>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label>Describe your video</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="A cinematic shot of clouds moving over mountains at sunrise, smooth motion..."
                className="min-h-[100px] resize-none bg-card/50 border-border/50"
                disabled={isLoading}
              />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
                  <SelectTrigger className="bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isLoading}>
                  <SelectTrigger className="bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((ar) => (
                      <SelectItem key={ar.value} value={ar.value}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seed</Label>
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
              className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 h-12 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Video
                </>
              )}
            </Button>

            {/* Result Area */}
            {(isLoading || generatedVideo) && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/30">
                  {isLoading ? (
                    <div className="aspect-square">
                      <Skeleton className="w-full h-full" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                        <p className="text-muted-foreground text-center px-4">
                          Creating your video...<br />
                          <span className="text-sm">This may take a moment</span>
                        </p>
                      </div>
                    </div>
                  ) : generatedVideo ? (
                    <video
                      src={generatedVideo}
                      controls
                      autoPlay
                      loop
                      className="w-full h-auto"
                    />
                  ) : null}
                </div>

                {generatedVideo && !isLoading && (
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
            {!isLoading && !generatedVideo && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                  <Video className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create AI Videos</h3>
                <p className="text-muted-foreground max-w-sm">
                  Describe motion and scenes. Shorter videos (4-6s) generate faster and more reliably.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewVideo;
