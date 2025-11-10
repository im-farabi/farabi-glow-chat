import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Volume2, ArrowLeft, Home, Play, Pause, Download, SkipForward, SkipBack, Volume1, Volume as VolumeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { getApiConfig } from '@/lib/api';

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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const buildPrompt = (): string => {
    let fullPrompt = prompt;

    // Add explanation level instructions
    if (explanationLevel === 'really-easy') {
      fullPrompt += ' in a way that a kid could understand';
    } else if (explanationLevel === 'simple') {
      fullPrompt += ' in a simple and easy way';
    }
    // 'normal' doesn't add extra text

    // Add duration constraints
    if (duration === '1min') {
      fullPrompt += ' and less than 1 minute';
    } else if (duration === '3min') {
      fullPrompt += ' and less than 3 minutes';
    }

    // Always add this to avoid AI saying "got it, I'll explain"
    fullPrompt += ' with no time waste like got it ill explain full straight to the point';

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

      console.log('Generating audio with URL:', apiUrl);

      const { apiKey } = getApiConfig();
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        
        let errorMessage = 'Failed to generate voice explanation. ';
        if (response.status === 402) {
          errorMessage += 'API authentication required. Please try again later.';
        } else if (response.status === 429) {
          errorMessage += 'Rate limit reached. Please wait a moment and try again.';
        } else if (response.status === 500) {
          errorMessage += 'Server error. Please try again.';
        } else {
          errorMessage += `Error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      
      // Validate blob
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio file. Please try again.');
      }
      
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
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try downloading and playing locally.",
          variant: "destructive",
        });
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
  };

  const handleSkipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
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

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioUrl]);

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
                  <div className="flex flex-col gap-4">
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                    
                    {/* Time display */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>

                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={handleSkipBackward} size="icon" variant="outline">
                        <SkipBack className="h-4 w-4" />
                      </Button>

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

                      <Button onClick={handleSkipForward} size="icon" variant="outline">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Playback speed */}
                    <div className="space-y-2">
                      <Label className="text-sm">Playback Speed</Label>
                      <div className="flex gap-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <Button
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
                            variant={playbackRate === rate ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                          >
                            {rate}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Volume control */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Volume1 className="h-4 w-4" />
                        Volume
                      </Label>
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Download button */}
                    <Button onClick={handleDownload} variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Audio
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      Your voice explanation is ready! Use the controls above to customize playback.
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
