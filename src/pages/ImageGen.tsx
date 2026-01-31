import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RefreshCw, ArrowLeft, History, Trash2, Clock, Sparkles, Image as ImageIcon, Plus, X, Copy, Check, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getImageHistory, saveImageToHistory, deleteImageFromHistory, ImageHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import PremiumBackground from '@/components/PremiumBackground';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const MODELS = [
  // APIFree.ai models (5)
  { id: 'openai/gpt-image-1.5', name: 'GPT Image 1.5', description: 'Best quality', api: 'apifree' },
  { id: 'google/nano-banana-pro', name: 'Nano Banana Pro', description: '4K + text', api: 'apifree' },
  { id: 'black-forest-labs/flux-2-dev', name: 'FLUX 2 DEV', description: 'Fast realism', api: 'apifree' },
  { id: 'qwen/qwen-image-2512', name: 'Qwen Image', description: 'Cheapest', api: 'apifree' },
  { id: 'tongyi-mai/z-image-turbo', name: 'Z Image Turbo', description: 'Fastest', api: 'apifree' },
  // Pollinations models (3)
  { id: 'flux', name: 'Flux Schnell', description: 'Free & fast', api: 'pollinations' },
  { id: 'seedream', name: 'Seedream 4.0', description: 'Good balance', api: 'pollinations' },
  { id: 'klein-large', name: 'FLUX.2 Klein 9B', description: 'High detail', api: 'pollinations' },
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

interface ImageMessage {
  id: string;
  type: 'user' | 'assistant';
  prompt?: string;
  referenceImage?: string;
  images?: GeneratedImage[];
  timestamp: number;
}

const ImageGen = () => {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<ImageMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AI Image Generator - Farabi's AI | Free Multi-Model Image Generation";
  }, []);

  useEffect(() => {
    setHistory(getImageHistory());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const ext = file.type.split('/')[1] || 'png';
      const fileName = `img-ref-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error } = await supabase.storage
        .from('video-temp-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('video-temp-images')
        .getPublicUrl(fileName);

      setUploadedImageUrl(urlData.publicUrl);
      toast({ title: 'Image uploaded', description: 'Reference image ready' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' });
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  }, [handleFileUpload]);

  const enhancePrompt = async () => {
    if (prompt.length < 3) return;
    setEnhancing(true);
    try {
      const hasReferenceImage = !!uploadedImage;
      
      const systemPrompt = hasReferenceImage
        ? `You are an expert prompt writer for image-to-image AI models.

CRITICAL: The user has uploaded a REFERENCE IMAGE. Any pronouns like "him", "her", "them", "the person", "this", "it" refer to the SUBJECT IN THE REFERENCE IMAGE.

Rules for image-to-image prompts:
1. PRESERVE references to the original image - use phrases like "the subject from the reference image", "the person in the photo"
2. Start with the subject and what transformation/action should happen
3. Add environment, background, lighting, mood
4. Include style details: photorealistic, cinematic lighting, color palette, lens info
5. Be specific with colors, textures, lighting
6. Use complete natural sentences, not keyword lists
7. Keep prompts 30-100 words

Examples:
- "make him meet ronaldo" → "The subject from the reference image meets Cristiano Ronaldo on a professional football field, both smiling, stadium lights, photorealistic, cinematic lighting, 85mm lens"
- "put her in paris" → "The person from the reference photo stands in front of the Eiffel Tower, daytime, soft natural lighting, travel photography style"

Return ONLY the enhanced prompt. No explanations, no quotes, no prefixes.`
        : `You are an expert prompt writer for text-to-image AI models.

Rules:
1. Start with the main subject
2. Add action or pose if relevant
3. Define environment, background, lighting, mood
4. Include style: photorealistic, cinematic, artistic, etc.
5. Add technical details: lens info, depth of field, color palette
6. Be specific with colors, textures, lighting
7. Use complete natural sentences
8. Keep prompts 30-100 words

Return ONLY the enhanced prompt. No explanations, no quotes, no prefixes.`;

      // Call pollinations-chat directly WITHOUT the FARABI persona
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: `${systemPrompt}\n\nOriginal prompt: "${prompt}"\n\nEnhanced prompt:`,
          model: 'gemini-2.5-flash',
          seed: Math.floor(Math.random() * 1000000),
          systemPrompt: 'You are a helpful assistant that enhances image generation prompts. Return ONLY the enhanced prompt text, nothing else.'
        }
      });

      if (error) throw error;
      
      let enhanced = data?.text || '';
      
      // Clean up the response
      let cleaned = enhanced
        .replace(/\*\*/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^.*?(?:Enhanced prompt|prompt|version|here|output|Here's|Here is):\s*/im, '')
        .replace(/\{image:[^}]+\}/g, '')
        .replace(/^(Alright|Okay|Sure|Here|Got it)[,!.]?\s*/i, '')
        .trim();
      
      if (cleaned.length > 10) {
        setPrompt(cleaned);
        toast({ 
          title: 'Prompt Enhanced!', 
          description: hasReferenceImage 
            ? 'Optimized for image-to-image editing' 
            : 'Your prompt has been improved' 
        });
      } else {
        throw new Error('Enhancement returned empty result');
      }
    } catch (err) {
      console.error('Enhance error:', err);
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

    const userMessage: ImageMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      prompt: prompt,
      referenceImage: uploadedImage || undefined,
      timestamp: Date.now()
    };

    const initialImages: GeneratedImage[] = MODELS.map((model, i) => ({
      id: i,
      imageUrl: null,
      loading: true,
      error: null,
      seed: Math.floor(Date.now() % 1000000) + i * 1000,
      modelName: model.name,
      modelId: model.id
    }));

    const assistantMessage: ImageMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      images: initialImages,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsGenerating(true);
    
    const currentPrompt = prompt;
    const currentImageUrl = uploadedImageUrl;
    setPrompt('');
    setUploadedImage(null);
    setUploadedImageUrl(null);

    const promises = initialImages.map(async (img) => {
      const model = MODELS.find(m => m.id === img.modelId);
      
      try {
        let imageUrl: string;
        
        if (model?.api === 'apifree') {
          // Use APIFree edge function
          const { data, error } = await supabase.functions.invoke('apifree-image', {
            body: {
              prompt: currentPrompt,
              model: img.modelId,
              aspect_ratio: '1:1',
              size: '1024x1024',
              quality: 'high'
            }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          imageUrl = data.imageUrl;
        } else {
          // Use Pollinations edge function
          const { data, error } = await supabase.functions.invoke('image-gen-multi', {
            body: {
              prompt: currentPrompt,
              model: img.modelId,
              seed: img.seed,
              imageUrl: currentImageUrl,
              width: 1024,
              height: 1024
            }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          imageUrl = data.imageUrl;
        }

        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessage.id && msg.images) {
            return {
              ...msg,
              images: msg.images.map(i => i.id === img.id ? { ...i, imageUrl, loading: false } : i)
            };
          }
          return msg;
        }));

        return { success: true, id: img.id, imageUrl };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Generation failed';
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessage.id && msg.images) {
            return {
              ...msg,
              images: msg.images.map(i => i.id === img.id ? { ...i, loading: false, error: errorMsg } : i)
            };
          }
          return msg;
        }));
        return { success: false, id: img.id };
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
    
    if (successCount > 0) {
      const currentImages = messages.find(m => m.id === assistantMessage.id)?.images;
      const firstSuccess = currentImages?.find(img => img.imageUrl);
      if (firstSuccess?.imageUrl) {
        saveImageToHistory({ prompt: currentPrompt, imageUrl: firstSuccess.imageUrl, sizePreset: 'multi-model' });
        setHistory(getImageHistory());
      }
    }

    setIsGenerating(false);
  };

  const regenerateSingle = async (messageId: string, imageId: number, currentPrompt: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.images) {
        return { ...msg, images: msg.images.map(i => i.id === imageId ? { ...i, loading: true, error: null } : i) };
      }
      return msg;
    }));

    const currentImage = messages.find(m => m.id === messageId)?.images?.find(i => i.id === imageId);
    if (!currentImage) return;

    const model = MODELS.find(m => m.id === currentImage.modelId);

    try {
      let imageUrl: string;
      
      if (model?.api === 'apifree') {
        const { data, error } = await supabase.functions.invoke('apifree-image', {
          body: { 
            prompt: currentPrompt, 
            model: currentImage.modelId, 
            aspect_ratio: '1:1',
            size: '1024x1024',
            quality: 'high'
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        imageUrl = data.imageUrl;
      } else {
        const { data, error } = await supabase.functions.invoke('image-gen-multi', {
          body: { 
            prompt: currentPrompt, 
            model: currentImage.modelId, 
            seed: Math.floor(Date.now() % 1000000),
            width: 1024,
            height: 1024
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        imageUrl = data.imageUrl;
      }

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.images) {
          return { ...msg, images: msg.images.map(i => i.id === imageId ? { ...i, imageUrl, loading: false } : i) };
        }
        return msg;
      }));
      toast({ title: 'Regenerated!' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Regeneration failed';
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.images) {
          return { ...msg, images: msg.images.map(i => i.id === imageId ? { ...i, loading: false, error: errorMsg } : i) };
        }
        return msg;
      }));
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
    toast({ title: 'Downloaded!' });
  };

  const copyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: 'Copied!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy image', variant: 'destructive' });
    }
  };

  const loadFromHistory = (item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    setIsHistoryOpen(false);
    toast({ title: 'Loaded', description: 'Prompt restored from history' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImages();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm bg-background/50">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <span className="font-semibold">AI Image</span>
              <p className="text-xs text-muted-foreground">8 Models</p>
            </div>
          </div>
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <History className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-xl border-border">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Image History</SheetTitle>
                <SheetDescription>Your recent generations</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                <div className="space-y-4 pr-4">
                  {history.length === 0 ? (
                    <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                      <p className="text-muted-foreground">No history yet</p>
                    </Card>
                  ) : (
                    history.map((item, index) => (
                      <Card 
                        key={item.id} 
                        className="bg-card/60 backdrop-blur-xl border-border/50 hover:border-pink-500/40 p-4 space-y-3 transition-all duration-300 cursor-pointer"
                        onClick={() => loadFromHistory(item)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-semibold line-clamp-2">{item.prompt}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.timestamp)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); deleteImageFromHistory(item.id); setHistory(getImageHistory()); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="Generated" className="w-full h-32 object-cover rounded-lg border border-border/50" />
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.2)]">
                  <ImageIcon className="w-12 h-12 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">AI Image Generator</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Generate 8 images simultaneously using different AI models. Add a reference image or just describe what you want!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {MODELS.map(model => (
                    <div key={model.id} className="px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-xs text-pink-300">
                      {model.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="animate-fade-in">
                    {msg.type === 'user' ? (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold">You</span>
                        </div>
                        <Card className="flex-1 bg-card/60 backdrop-blur-sm border-border/50 p-4">
                          {msg.referenceImage && (
                            <img src={msg.referenceImage} alt="Reference" className="max-w-[200px] rounded-lg border border-border/50 mb-3" />
                          )}
                          <p className="text-foreground">{msg.prompt}</p>
                        </Card>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.3)] shrink-0">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <span className="font-semibold text-foreground">AI Images</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {msg.images?.map((img) => (
                              <Card 
                                key={img.id} 
                                className="group relative bg-card/60 backdrop-blur-xl border-border/50 hover:border-pink-500/40 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(236,72,153,0.15)]"
                              >
                                <div className="aspect-square relative">
                                  {img.loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-500/5">
                                      <div className="text-center space-y-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
                                        <p className="text-xs text-muted-foreground">{img.modelName}</p>
                                      </div>
                                    </div>
                                  ) : img.error ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 p-4">
                                      <div className="text-center space-y-2">
                                        {img.error?.includes('safety') || img.error?.includes('blocked') ? (
                                          <p className="text-xs text-yellow-400">⚠️ {img.error}</p>
                                        ) : img.error?.includes('Rate limit') ? (
                                          <p className="text-xs text-orange-400">🔄 {img.error}</p>
                                        ) : (
                                          <p className="text-xs text-red-400">❌ {img.error}</p>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const userMsg = messages.find(m => m.type === 'user' && m.timestamp < msg.timestamp);
                                            regenerateSingle(msg.id, img.id, userMsg?.prompt || '');
                                          }}
                                          className="border-pink-500/30 hover:border-pink-500/50"
                                        >
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Retry
                                        </Button>
                                      </div>
                                    </div>
                                  ) : img.imageUrl ? (
                                    <img 
                                      src={img.imageUrl} 
                                      alt={`Generated by ${img.modelName}`}
                                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                      onClick={() => {
                                        const userMsg = messages.find(m => m.type === 'user' && m.timestamp < msg.timestamp);
                                        setSelectedImage(img);
                                        setSelectedPrompt(userMsg?.prompt || '');
                                      }}
                                    />
                                  ) : (
                                    <Skeleton className="w-full h-full" />
                                  )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                  <p className="text-xs text-white/90 text-center font-medium">{img.modelName}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div 
              className={`bg-card/80 backdrop-blur-xl rounded-2xl border-2 shadow-[0_8px_32px_rgba(236,72,153,0.15)] transition-all duration-300 ${
                dragActive ? 'border-pink-500 bg-pink-500/10' : 'border-border/50 hover:border-pink-500/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {/* Reference Image Preview */}
              {uploadedImage && (
                <div className="flex items-center gap-3 p-3 border-b border-border/50">
                  <div className="relative">
                    <img src={uploadedImage} alt="Reference" className="w-16 h-16 rounded-lg object-cover border border-border/50" />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Reference Image</p>
                    <p className="text-xs text-muted-foreground">AI will use this as a guide</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setUploadedImage(null); setUploadedImageUrl(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-3 p-3">
                {/* Plus button for image upload */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-xl hover:bg-pink-500/10 shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </Button>

                {/* Textarea */}
                <div className="flex-1">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the image you want to generate..."
                    className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base min-h-[60px] max-h-[150px] px-0"
                    disabled={isGenerating}
                  />
                </div>

                {/* Enhance button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={enhancePrompt}
                  disabled={enhancing || prompt.length < 3}
                  className="h-10 w-10 rounded-xl hover:bg-pink-500/10 shrink-0"
                >
                  {enhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>

                {/* Send button */}
                <Button
                  onClick={generateImages}
                  disabled={isGenerating || prompt.length < 3}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-purple-600 hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-110 transition-all shrink-0"
                  size="icon"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-screen image preview lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-pink-500/30 overflow-hidden">
            <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-6">
              {/* Model badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 z-10">
                <span className="text-sm text-pink-300 font-medium">{selectedImage?.modelName}</span>
              </div>

              {/* Image */}
              <img 
                src={selectedImage?.imageUrl || ''} 
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => selectedImage?.imageUrl && downloadImage(selectedImage.imageUrl, selectedImage.id)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => selectedImage?.imageUrl && copyImage(selectedImage.imageUrl)}
                  className="border-pink-500/50 text-pink-300 hover:bg-pink-500/10"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (selectedImage) {
                      const assistantMsg = messages.find(m => m.type === 'assistant' && m.images?.some(i => i.id === selectedImage.id));
                      if (assistantMsg) {
                        regenerateSingle(assistantMsg.id, selectedImage.id, selectedPrompt);
                      }
                      setSelectedImage(null);
                    }
                  }}
                  className="border-pink-500/50 text-pink-300 hover:bg-pink-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                </Button>
              </div>

              {/* Prompt */}
              <p className="text-sm text-gray-400 mt-4 text-center max-w-2xl italic">
                "{selectedPrompt}"
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ImageGen;
