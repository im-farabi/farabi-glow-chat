import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Volume2, ArrowLeft, Home, Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

// Set page-specific SEO
const useVoiceExplainPageSEO = () => {
  useEffect(() => {
    document.title = "Voice Explanation Generator - Farabi's AI Chatbot | Free AI Audio Explainer";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI-powered voice explanations on any topic. Choose from multiple voices and explanation levels for personalized audio learning.');
    }
  }, []);
};

const VoiceExplain = () => {
  useVoiceExplainPageSEO();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState<'nova' | 'alloy' | 'orion'>('nova');
  const [explanationLevel, setExplanationLevel] = useState<'really-easy' | 'simple' | 'normal'>('simple');
  const [duration, setDuration] = useState<'1min' | '3min' | 'auto'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const buildPrompt = (): string => {
    let fullPrompt = prompt;

    // Add explanation level instructions
    if (explanationLevel === 'really-easy') {
      fullPrompt += ' Explain like you would explain to a kid';
    } else if (explanationLevel === 'simple') {
      fullPrompt += ' Explain in a simple and easy way';
    } else if (explanationLevel === 'normal') {
      fullPrompt += ' Explain in a normal way';
    }

    // Add duration constraints
    if (duration === '1min') {
      fullPrompt += ' and keep it under 1 minute with no time waste, straight to the point';
    } else if (duration === '3min') {
      fullPrompt += ' and keep it under 3 minutes with no time waste, straight to the point';
    } else {
      fullPrompt += ' with no time waste like "got it, I\'ll explain", just go straight to the point';
    }

    return fullPrompt;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter a topic to explain.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const fullPrompt = buildPrompt();
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const apiUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai-audio&voice=${voice}`;

      toast({
        title: "Generating Audio",
        description: "Please wait, your audio is being made. It might take a few minutes or seconds.",
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice explanation');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Audio Generated!",
        description: "Your voice explanation is ready to play.",
      });
    } catch (error) {
      console.error('Error generating voice explanation:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate voice explanation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-explanation-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download Started",
      description: "Your audio file is being downloaded.",
    });
  };

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Go home"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <Card className="backdrop-blur-sm bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Volume2 className="h-6 w-6 text-primary" />
              Voice Explanation Generator
            </CardTitle>
            <p className="text-muted-foreground">
              Get AI-powered voice explanations on any topic with customizable voices and explanation styles.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">What would you like explained?</Label>
              <Textarea
                id="prompt"
                placeholder="E.g., Explain me the history of Bengal in a way that kids could understand..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voice Artist</Label>
                <Select value={voice} onValueChange={(value: any) => setVoice(value)} disabled={isGenerating}>
                  <SelectTrigger id="voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova">Nova</SelectItem>
                    <SelectItem value="alloy">Alloy</SelectItem>
                    <SelectItem value="orion">Orion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Explanation Level</Label>
                <Select value={explanationLevel} onValueChange={(value: any) => setExplanationLevel(value)} disabled={isGenerating}>
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="really-easy">Really Easy</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">How Long</Label>
                <Select value={duration} onValueChange={(value: any) => setDuration(value)} disabled={isGenerating}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1min">&lt;1 min</SelectItem>
                    <SelectItem value="3min">&lt;3 min</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Generate Voice Explanation
                </>
              )}
            </Button>

            {audioUrl && (
              <Card className="mt-6 bg-accent/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                    
                    <div className="flex gap-2">
                      <Button onClick={handlePlayPause} size="lg">
                        {isPlaying ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Play
                          </>
                        )}
                      </Button>

                      <Button onClick={handleDownload} variant="outline" size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Your voice explanation is ready! Click play to listen or download to save it.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceExplain;
