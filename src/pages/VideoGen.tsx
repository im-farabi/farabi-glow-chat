import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, Upload, X, AlertTriangle, Download, RefreshCw, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PremiumBackground from '@/components/PremiumBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ModelType = 'veo' | 'seedance' | 'seedance-pro';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  dataUrl: string;
}

const VideoGen = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('veo');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(6);
  const [audio, setAudio] = useState(false);
  const [seed, setSeed] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Model-specific configurations
  const modelConfigs = {
    veo: { maxImages: 2, durations: [4, 6, 8], hasAudio: true, label: 'Veo 3.1 Fast' },
    seedance: { maxImages: 1, durations: [2, 3, 4, 5, 6, 7, 8, 9, 10], hasAudio: false, label: 'Seedance' },
    'seedance-pro': { maxImages: 1, durations: [2, 3, 4, 5, 6, 7, 8, 9, 10], hasAudio: false, label: 'Seedance Pro' },
  };

  const currentConfig = modelConfigs[model];

  // Reset images when model changes if exceeds limit
  useEffect(() => {
    if (images.length > currentConfig.maxImages) {
      setImages(prev => prev.slice(0, currentConfig.maxImages));
    }
    // Reset audio if model doesn't support it
    if (!currentConfig.hasAudio) {
      setAudio(false);
    }
    // Adjust duration if not in valid range
    if (!currentConfig.durations.includes(duration)) {
      setDuration(currentConfig.durations[Math.floor(currentConfig.durations.length / 2)]);
    }
  }, [model]);

  const convertToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = currentConfig.maxImages - images.length;
    
    if (remaining <= 0) {
      toast.error(`Maximum ${currentConfig.maxImages} image(s) allowed for ${currentConfig.label}`);
      return;
    }

    const filesToAdd = fileArray.slice(0, remaining);

    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        continue;
      }

      try {
        const dataUrl = await convertToDataUrl(file);
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          dataUrl,
        };
        setImages(prev => [...prev, newImage]);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Failed to process image');
      }
    }
  }, [images.length, currentConfig.maxImages, currentConfig.label]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary');
    
    if (e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-primary');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary');
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      handleImageUpload(imageFiles);
    }
  }, [handleImageUpload]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setLoadingStatus('Initializing...');

    const statusInterval = setInterval(() => {
      setLoadingStatus(prev => {
        const statuses = [
          'Sending request...',
          'Processing prompt...',
          'Generating video frames...',
          'Rendering video...',
          'Almost there...',
        ];
        const currentIndex = statuses.indexOf(prev);
        return statuses[Math.min(currentIndex + 1, statuses.length - 1)];
      });
    }, 3000);

    try {
      // Prepare image URLs (using data URLs for now)
      const imageUrls = images.map(img => img.dataUrl);

      const { data, error } = await supabase.functions.invoke('video-gen', {
        body: {
          prompt,
          model,
          duration,
          aspectRatio,
          audio: audio && model === 'veo',
          images: imageUrls.length > 0 ? imageUrls : undefined,
          seed: seed || undefined,
        },
      });

      clearInterval(statusInterval);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        toast.success('Video generated successfully!');
      } else {
        throw new Error('No video returned');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      clearInterval(statusInterval);
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setGeneratedVideo(null);
    handleGenerate();
  };

  return (
    <div className="min-h-screen relative">
      <PremiumBackground />
      
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">AI Video Generator</h1>
          </div>
          <span className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            BETA
          </span>
        </div>

        {/* Experimental Warning */}
        <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-200">
              <strong>Experimental Feature:</strong> Video generation may take 1-3 minutes. Results may vary based on prompt complexity and model.
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Model Selection */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(modelConfigs) as ModelType[]).map((m) => (
                  <Button
                    key={m}
                    variant={model === m ? 'default' : 'outline'}
                    onClick={() => setModel(m)}
                    className={model === m ? 'bg-primary' : ''}
                  >
                    {modelConfigs[m].label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Describe your video</CardTitle>
              <CardDescription>Be specific about motion, scene, and style</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="A cat playing piano in a jazz club, cinematic lighting, smooth camera movement..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Reference Images (Optional)
              </CardTitle>
              <CardDescription>
                {model === 'veo' 
                  ? 'Add up to 2 images for first/last frame interpolation'
                  : 'Add 1 reference image for style guidance'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <div
                ref={dropZoneRef}
                onClick={() => images.length < currentConfig.maxImages && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${images.length >= currentConfig.maxImages 
                    ? 'border-muted opacity-50 cursor-not-allowed' 
                    : 'border-border hover:border-primary/50'}
                `}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop, paste, or click to add images
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {images.length}/{currentConfig.maxImages} images
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {images.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Reference ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {model === 'veo' && (
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {index === 0 ? 'Start' : 'End'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration: {duration} seconds</Label>
                {model === 'veo' ? (
                  <div className="flex gap-2">
                    {currentConfig.durations.map((d) => (
                      <Button
                        key={d}
                        variant={duration === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDuration(d)}
                      >
                        {d}s
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Slider
                    value={[duration]}
                    onValueChange={([v]) => setDuration(v)}
                    min={2}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                )}
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Toggle (Veo only) */}
              {currentConfig.hasAudio && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Generate with Audio</Label>
                    <p className="text-xs text-muted-foreground">AI-generated audio for your video</p>
                  </div>
                  <Switch checked={audio} onCheckedChange={setAudio} />
                </div>
              )}

              {/* Seed */}
              <div className="space-y-2">
                <Label>Seed (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Random seed for reproducibility"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {loadingStatus}
              </>
            ) : (
              <>
                <Video className="mr-2 h-5 w-5" />
                Generate Video
              </>
            )}
          </Button>

          {/* Generated Video */}
          {generatedVideo && (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Generated Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <video
                  src={generatedVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg"
                />
                <div className="flex gap-3">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={handleRegenerate} variant="outline" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGen;
