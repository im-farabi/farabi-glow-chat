import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RefreshCw, ArrowLeft, History, Trash2, Clock, Sparkles, Image as ImageIcon, Plus, X, Copy, Check } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { getImageHistory, saveImageToHistory, deleteImageFromHistory, ImageHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import GreenBackground from '@/components/GreenBackground';
import { Skeleton } from '@/components/ui/skeleton';

const MODELS = [
  { id: 'seedream-pro', name: 'Seedream 4.5 Pro', description: 'Premium quality' },
  { id: 'klein-large', name: 'FLUX.2 Klein 9B', description: 'High detail' },
  { id: 'gptimage-large', name: 'GPT Image 1.5', description: 'Transparency support' },
  { id: 'seedream', name: 'Seedream 4.0', description: 'Good balance' },
  { id: 'klein', name: 'FLUX.2 Klein 4B', description: 'Faster generation' },
];

interface GeneratedImage {
  id: number;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  seed: number;
  modelName: string;
  modelId: string;
}

const ImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AI Image Generator - Farabi's AI | Free Multi-Model Image Generation";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate 5 AI images simultaneously with multiple models. Seedream, FLUX Klein, GPT Image - all free. Drag & drop reference images.');
    }
  }, []);

  useEffect(() => {
    setHistory(getImageHistory());
  }, []);

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFileUpload(file);
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    // Show preview immediately (base64 for UI only)
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Upload to Supabase Storage
      const ext = file.type.split('/')[1] || 'png';
      const fileName = `img-ref-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error } = await supabase.storage
        .from('video-temp-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('video-temp-images')
        .getPublicUrl(fileName);

      setUploadedImageUrl(urlData.publicUrl);
      toast({ title: 'Image uploaded', description: 'Reference image ready for generation' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: 'Could not upload image to storage', variant: 'destructive' });
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const enhancePrompt = async () => {
    if (prompt.length < 3) {
      toast({ title: 'Error', description: 'Prompt must be at least 3 characters', variant: 'destructive' });
      return;
    }

    setEnhancing(true);
    try {
      const enhanced = await sendNormal(
        `CRITICAL: Respond with ONLY the enhanced image prompt. NO greetings, NO explanations, NO markdown.
        
Task: Transform this into a vivid, detailed image description with lighting, mood, style, and composition. Keep under 400 characters.

Input: "${prompt}"

Output ONLY the enhanced prompt:`
      );
      
      let cleaned = enhanced
        .replace(/\*\*/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^.*?(?:prompt|version|here|output):\s*/im, '')
        .replace(/\{image:[^}]+\}/g, '')
        .trim();
      
      setPrompt(cleaned);
      toast({ title: 'Prompt Enhanced!', description: 'Your prompt has been improved' });
    } catch {
      toast({ title: 'Error', description: 'Failed to enhance prompt', variant: 'destructive' });
    } finally {
      setEnhancing(false);
    }
  };

  const generateImages = async () => {
    if (prompt.length < 3) {
      toast({ title: 'Error', description: 'Prompt must be at least 3 characters', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    // Initialize 5 image slots - each with a DIFFERENT model
    const initialImages: GeneratedImage[] = MODELS.map((model, i) => ({
      id: i,
      imageUrl: null,
      loading: true,
      error: null,
      seed: Math.floor(Date.now() % 1000000) + i * 1000,
      modelName: model.name,
      modelId: model.id
    }));
    setGeneratedImages(initialImages);

    // Generate 5 images in parallel - each using its own model
    const promises = initialImages.map(async (img) => {
      try {
        const { data, error } = await supabase.functions.invoke('image-gen-multi', {
          body: {
            prompt,
            model: (img as GeneratedImage & { modelId: string }).modelId,
            seed: img.seed,
            imageUrl: uploadedImageUrl || undefined,
            width: 1024,
            height: 1024
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        setGeneratedImages(prev => prev.map(p => 
          p.id === img.id 
            ? { ...p, imageUrl: data.imageUrl, loading: false }
            : p
        ));

        return { success: true, id: img.id, imageUrl: data.imageUrl };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Generation failed';
        setGeneratedImages(prev => prev.map(p => 
          p.id === img.id 
            ? { ...p, loading: false, error: errorMsg }
            : p
        ));
        return { success: false, id: img.id };
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
    
    if (successCount > 0) {
      // Save first successful image to history
      const firstSuccess = generatedImages.find(img => img.imageUrl);
      if (firstSuccess?.imageUrl) {
        saveImageToHistory({
          prompt,
          imageUrl: firstSuccess.imageUrl,
          sizePreset: 'multi-model'
        });
        setHistory(getImageHistory());
      }
      
      toast({ title: 'Success!', description: `Generated ${successCount}/5 images` });
    } else {
      toast({ title: 'Error', description: 'All generations failed', variant: 'destructive' });
    }

    setIsGenerating(false);
  };

  const regenerateSingle = async (index: number) => {
    const currentImage = generatedImages[index];
    if (!currentImage) return;

    setGeneratedImages(prev => prev.map((p, i) => 
      i === index ? { ...p, loading: true, error: null } : p
    ));

    try {
      const newSeed = Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 10000);
      
      // Use the same model that was used for this slot
      const { data, error } = await supabase.functions.invoke('image-gen-multi', {
        body: {
          prompt,
          model: currentImage.modelId,
          seed: newSeed,
          imageUrl: uploadedImageUrl || undefined,
          width: 1024,
          height: 1024
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setGeneratedImages(prev => prev.map((p, i) => 
        i === index ? { ...p, imageUrl: data.imageUrl, loading: false, seed: newSeed } : p
      ));
      
      toast({ title: 'Regenerated!', description: 'New image generated' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Regeneration failed';
      setGeneratedImages(prev => prev.map((p, i) => 
        i === index ? { ...p, loading: false, error: errorMsg } : p
      ));
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${index + 1}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloaded!', description: 'Image saved' });
  };

  const copyImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({ title: 'Copied!', description: 'Image copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy image', variant: 'destructive' });
    }
  };

  const loadFromHistory = (item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    setIsHistoryOpen(false);
    toast({ title: 'Loaded', description: 'Prompt restored from history' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black relative">
      <GreenBackground />
      <div className="relative z-10">
        <Header showTemporaryToggle={false} />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Header section */}
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/40 hover:border-green-500/70 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 group backdrop-blur-md"
              >
                <ArrowLeft className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
                <span className="text-gray-200 group-hover:text-white transition-colors font-semibold">Back to Chat</span>
              </button>
              <div className="space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-sm border-2 border-green-500/50 mb-3 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <ImageIcon className="w-14 h-14 text-green-300" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                  AI Image Generator
                </h1>
                <p className="text-xl text-gray-200 font-medium">
                  Compare 5 AI models side-by-side with one prompt
                </p>
              </div>
            </div>
            
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all"
                >
                  <History className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] bg-black/95 backdrop-blur-xl border-green-500/20">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Image History</SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    Your recent image generations
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                  <div className="space-y-4 pr-4">
                    {history.length === 0 ? (
                      <Card className="bg-card/50 backdrop-blur-xl border-green-500/20 p-8 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="text-muted-foreground">No history yet</p>
                      </Card>
                    ) : (
                      history.map((item, index) => (
                        <Card 
                          key={item.id} 
                          className="bg-card/60 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 shadow-[0_4px_16px_rgba(34,197,94,0.1)] hover:shadow-[0_4px_24px_rgba(34,197,94,0.2)] p-4 space-y-3 transition-all duration-300 hover:scale-[1.02] animate-fade-in cursor-pointer"
                          style={{ animationDelay: `${index * 0.05}s` }}
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-2">
                              <p className="text-sm font-semibold line-clamp-2 text-foreground">{item.prompt}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 text-green-400" />
                                {formatDate(item.timestamp)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteImageFromHistory(item.id);
                                setHistory(getImageHistory());
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt="Generated" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-green-500/20"
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

          {/* Main input card */}
          <Card className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-2xl border-2 border-green-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.25),0_0_60px_rgba(16,185,129,0.15)] hover:shadow-[0_12px_48px_rgba(34,197,94,0.35),0_0_80px_rgba(16,185,129,0.25)] hover:border-green-500/60 transition-all duration-500 p-8 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Models info */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">AI Models (generates with all 5)</Label>
              <div className="flex flex-wrap gap-2">
                {MODELS.map(model => (
                  <div key={model.id} className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-xs text-green-300">
                    {model.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload zone */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Reference Image (Optional)</Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-green-500/30 hover:border-green-500/50 bg-background/30'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                {uploadedImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="max-h-40 rounded-lg border-2 border-green-500/30"
                    />
                    <button
                      onClick={() => { setUploadedImage(null); setUploadedImageUrl(null); }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 hover:border-green-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                      >
                        <Plus className="w-8 h-8 text-green-400" />
                      </button>
                    </div>
                    <p className="text-muted-foreground">
                      Drop image here, paste (Ctrl+V), or click +
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            </div>

            {/* Prompt input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={enhancePrompt}
                  disabled={enhancing || prompt.length < 3}
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  {enhancing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Enhance
                </Button>
              </div>
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none bg-background/50 border-green-500/30 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                disabled={isGenerating}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{prompt.length}/500 characters</p>
                <Button
                  onClick={generateImages}
                  disabled={isGenerating || prompt.length < 3}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 5 Images
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Generated images grid */}
          {generatedImages.length > 0 && (
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Generated Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {generatedImages.map((img, index) => (
                  <Card 
                    key={img.id} 
                    className="group relative bg-card/60 backdrop-blur-xl border-2 border-green-500/20 hover:border-green-500/40 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(34,197,94,0.2)]"
                  >
                    <div className="aspect-square relative">
                      {img.loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                          <div className="text-center space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto" />
                            <p className="text-xs text-muted-foreground">Generating #{index + 1}</p>
                          </div>
                        </div>
                      ) : img.error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 p-4">
                          <div className="text-center space-y-2">
                            <p className="text-xs text-red-400">{img.error}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => regenerateSingle(index)}
                              className="border-green-500/30 hover:border-green-500/50"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        </div>
                      ) : img.imageUrl ? (
                        <>
                          <img 
                            src={img.imageUrl} 
                            alt={`Generated ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay with actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => downloadImage(img.imageUrl!, index)}
                              className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Download className="w-5 h-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyImage(img.imageUrl!, index)}
                              className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
                            >
                              {copiedIndex === index ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => regenerateSingle(index)}
                              className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Skeleton className="w-full h-full" />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white/70 text-center">{img.modelName}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ImageGen;
