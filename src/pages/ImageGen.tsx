import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RefreshCw, ArrowLeft, History, Trash2, Clock, Sparkles, Palette, Type, Minus, Plus, Bold, Italic } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { getImageHistory, saveImageToHistory, deleteImageFromHistory, ImageHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Canvas as FabricCanvas, IText, FabricImage } from 'fabric';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

const ImageGen = () => {
  useEffect(() => {
    document.title = "AI Image Generator - Farabi's AI Chatbot | Free Image Generation";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI images from text prompts for free. Create banners, logos, and custom images using advanced AI models. No signup required.');
    }
  }, []);

  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string>('');
  const [currentSeed, setCurrentSeed] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [sizePreset, setSizePreset] = useState<'banner' | 'logo' | 'custom'>('banner');
  const [customWidth, setCustomWidth] = useState('1024');
  const [customHeight, setCustomHeight] = useState('1024');
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const navigate = useNavigate();

  // Virtual Editor state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Montserrat');
  const [textColor, setTextColor] = useState('#000000');
  const [textOpacity, setTextOpacity] = useState(100);
  const [textStyle, setTextStyle] = useState<'normal' | 'bold' | 'italic'>('normal');

  useEffect(() => {
    setHistory(getImageHistory());
  }, []);

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth > 768 ? 800 : window.innerWidth - 80,
      height: window.innerWidth > 768 ? 600 : 400,
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);

    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj && obj.type === 'i-text') {
        const textObj = obj as IText;
        setSelectedObject(textObj);
        setFontSize(textObj.fontSize || 32);
        setFontFamily(textObj.fontFamily || 'Montserrat');
        setTextColor(textObj.fill as string || '#000000');
        setTextOpacity((textObj.opacity || 1) * 100);
      }
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      if (obj && obj.type === 'i-text') {
        const textObj = obj as IText;
        setSelectedObject(textObj);
        setFontSize(textObj.fontSize || 32);
        setFontFamily(textObj.fontFamily || 'Montserrat');
        setTextColor(textObj.fill as string || '#000000');
        setTextOpacity((textObj.opacity || 1) * 100);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update selected object properties
  useEffect(() => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;

    if (fontSize) selectedObject.set('fontSize', fontSize);
    if (fontFamily) selectedObject.set('fontFamily', fontFamily);
    if (textColor) selectedObject.set('fill', textColor);
    if (textOpacity !== undefined) selectedObject.set('opacity', textOpacity / 100);
    
    if (textStyle === 'bold') {
      selectedObject.set({ fontWeight: 'bold', fontStyle: 'normal' });
    } else if (textStyle === 'italic') {
      selectedObject.set({ fontWeight: 'normal', fontStyle: 'italic' });
    } else {
      selectedObject.set({ fontWeight: 'normal', fontStyle: 'normal' });
    }

    fabricCanvas?.renderAll();
  }, [fontSize, fontFamily, textColor, textOpacity, textStyle, selectedObject, fabricCanvas]);

  const enhancePrompt = async () => {
    const trimmedPrompt = prompt.trim();
    
    if (trimmedPrompt.length < 3) {
      toast({
        title: 'Error',
        description: 'Prompt must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setStatus('Enhancing prompt...');
    try {
      const enhanced = await sendNormal(
        `CRITICAL INSTRUCTION: Respond with ONLY the enhanced image prompt. NO greetings, NO explanations, NO markdown formatting (**, etc), NO emojis, NO extra text, NO {image:...} tags whatsoever.

Task: Transform this image prompt into a detailed, vivid description with rich visual details (lighting, setting, mood, camera angle, style). Keep it under 500 characters and maintain natural language flow.

Input: "${trimmedPrompt}"

Output ONLY the enhanced prompt text (no {image:...} tags):`
      );
      
      let cleaned = enhanced
        .replace(/\*\*/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^.*?(?:prompt|version|here|output):\s*/im, '')
        .replace(/[🤙💀😉👇📸✨]/g, '')
        .replace(/\{image:[^}]+\}/g, '')
        .trim();
      
      const quotedMatch = cleaned.match(/"([^"]+)"/);
      if (quotedMatch) {
        cleaned = quotedMatch[1];
      }
      
      setPrompt(cleaned);
      toast({
        title: 'Prompt Enhanced!',
        description: 'Your prompt has been improved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enhance prompt',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const generateImage = async (useNewSeed = false) => {
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
    setStatus('Generating image...');

    const fetchImageAsBlob = async (url: string): Promise<string> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      if (image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
      
      return URL.createObjectURL(blob);
    };
    
    try {
      const encoded = encodeURIComponent(trimmedPrompt);
      const seed = useNewSeed ? Date.now() + Math.floor(Math.random() * 1000000) : currentSeed || Date.now();
      
      if (!useNewSeed && !currentSeed) {
        setCurrentSeed(seed);
      } else if (useNewSeed) {
        setCurrentSeed(seed);
      }

      const url = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${seed}&enhance=false&nologo=true&key=plln_pk_DSf8DvxaLKn2LbP9QQAlA5hFpQGXePYiSY1AHZQn2CiKgtO7VBKQ1FNw1xCEpRYK`;
      
      const blobUrl = await fetchImageAsBlob(url);
      setImage(blobUrl);
      
      saveImageToHistory({
        prompt: trimmedPrompt,
        imageUrl: blobUrl,
        sizePreset: sizePreset === 'custom' ? `${width}x${height}` : sizePreset
      });
      setHistory(getImageHistory());
      
      toast({
        title: 'Success!',
        description: 'Image generated successfully',
      });
    } catch (error) {
      try {
        const encoded = encodeURIComponent(trimmedPrompt);
        const fallbackSeed = Date.now() + Math.floor(Math.random() * 9999999);
        const fallbackUrl = `https://enter.pollinations.ai/api/generate/image/${encoded}?model=flux&width=${width}&height=${height}&seed=${fallbackSeed}&enhance=true&nologo=true`;
        const blobUrl = await fetchImageAsBlob(fallbackUrl);
        setImage(blobUrl);
        
        toast({
          title: 'Success!',
          description: 'Image generated successfully (fallback)',
        });
      } catch (fallbackError) {
        toast({
          title: 'Error',
          description: 'Failed to generate. Try refreshing page and editing the prompt!',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const addImageToCanvas = (imgUrl: string) => {
    if (!fabricCanvas) return;

    FabricImage.fromURL(imgUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      const maxWidth = fabricCanvas.width! * 0.8;
      const maxHeight = fabricCanvas.height! * 0.8;
      
      const scale = Math.min(
        maxWidth / img.width!,
        maxHeight / img.height!,
        1
      );
      
      img.scale(scale);
      img.set({
        left: (fabricCanvas.width! - img.width! * scale) / 2,
        top: (fabricCanvas.height! - img.height! * scale) / 2,
      });
      
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      
      toast({
        title: 'Image Added!',
        description: 'Image added to canvas',
      });
    });
  };

  const addTextToCanvas = () => {
    if (!fabricCanvas) return;

    const text = new IText('Add a text', {
      left: 100,
      top: 100,
      fontSize: 32,
      fontFamily: 'Montserrat',
      fill: '#000000',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();

    toast({
      title: 'Text Added!',
      description: 'Click on text to edit',
    });
  };

  const downloadCanvas = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Downloaded!',
      description: 'Design saved to your downloads',
    });
  };

  const loadFromHistory = (item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    setImage(item.imageUrl);
    if (item.sizePreset.includes('x')) {
      const [w, h] = item.sizePreset.split('x');
      setSizePreset('custom');
      setCustomWidth(w);
      setCustomHeight(h);
    } else {
      setSizePreset(item.sizePreset as 'banner' | 'logo' | 'custom');
    }
    setIsHistoryOpen(false);
    toast({
      title: 'Loaded from history',
      description: 'Image and settings restored'
    });
  };

  const deleteHistoryItem = (id: string) => {
    deleteImageFromHistory(id);
    setHistory(getImageHistory());
    toast({
      title: 'Deleted',
      description: 'History item removed'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://farabi.me/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Image Generator",
              "item": "https://farabi.me/image-gen"
            }
          ]
        })}
      </script>
      
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3 justify-between flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Image Generator
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Generate AI images and edit them
                </p>
              </div>
            </div>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <History className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[90vw] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Image History</SheetTitle>
                  <SheetDescription>
                    Your recent image generations
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                  <div className="space-y-4 pr-4">
                    {history.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No history yet</p>
                    ) : (
                      history.map((item) => (
                        <Card key={item.id} className="p-4 space-y-3 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-2">
                              <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(item.timestamp)}
                              </div>
                              <p className="text-xs text-muted-foreground">Size: {item.sizePreset}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => loadFromHistory(item)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteHistoryItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt="Generated" 
                              className="w-full h-32 object-cover rounded border"
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

          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 text-base">
              <TabsTrigger value="generate" className="text-base">Generate Image</TabsTrigger>
              <TabsTrigger value="editor" className="text-base">Virtual Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6 mt-6">
              <Card className="p-6 md:p-8 space-y-6 bg-card border-border">
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-lg font-semibold">Type prompt to generate image</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[140px] resize-none text-lg"
                    disabled={loading}
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground text-right">
                    {prompt.length}/500 characters
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="size" className="text-base">Image Size</Label>
                  <Select value={sizePreset} onValueChange={(value: 'banner' | 'logo' | 'custom') => setSizePreset(value)}>
                    <SelectTrigger id="size" className="bg-background h-12 text-base">
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
                        className="h-12 text-base"
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
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={enhancePrompt}
                    disabled={loading}
                    variant="outline"
                    className="flex-1 text-lg h-14"
                  >
                    {loading && status.includes('Enhancing') ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Enhance Prompt
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => generateImage(false)}
                    disabled={loading}
                    className="flex-1 text-lg h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    {loading && !status.includes('Enhancing') ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
                {status && (
                  <p className="text-base text-muted-foreground text-center">{status}</p>
                )}
              </Card>

              {image && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 overflow-hidden bg-card border-border">
                    <div className="aspect-video relative">
                      <img
                        src={image}
                        alt={prompt ? `AI generated image: ${prompt.slice(0, 100)}` : "AI generated image"}
                        className="w-full h-full object-contain bg-muted"
                        loading="lazy"
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-card border-border flex flex-col gap-4">
                    <h3 className="text-xl font-semibold">Actions</h3>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = image;
                        link.download = `generated-image-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      variant="outline"
                      className="w-full h-12 text-base"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download
                    </Button>
                    <Button
                      onClick={() => addImageToCanvas(image)}
                      variant="outline"
                      className="w-full h-12 text-base"
                    >
                      <Palette className="mr-2 h-5 w-5" />
                      Edit in Virtual Editor
                    </Button>
                    <Button
                      onClick={() => generateImage(true)}
                      disabled={loading}
                      variant="outline"
                      className="w-full h-12 text-base"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Regen
                        </>
                      )}
                    </Button>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="editor" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Left Sidebar - Tools */}
                <Card className="p-6 space-y-6 h-fit">
                  <h3 className="font-bold text-xl">Tools</h3>
                  
                  <Button
                    onClick={addTextToCanvas}
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-16 text-lg"
                    title="Add Text"
                  >
                    <Type className="mr-3 h-7 w-7" />
                    Add Text
                  </Button>

                  {image && (
                    <Button
                      onClick={() => addImageToCanvas(image)}
                      variant="outline"
                      size="lg"
                      className="w-full justify-start h-16 text-lg"
                      title="Add Generated Image to Canvas"
                    >
                      <Palette className="mr-3 h-7 w-7" />
                      Add Generated Image
                    </Button>
                  )}

                  {selectedObject && selectedObject.type === 'i-text' && (
                    <div className="space-y-6 pt-6 border-t">
                      <h4 className="font-semibold text-lg">Text Properties</h4>
                      
                      <div className="space-y-3">
                        <Label className="text-base">Font</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">Size</Label>
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setFontSize(Math.max(8, fontSize - 2))}
                            className="h-12 w-12"
                          >
                            <Minus className="h-5 w-5" />
                          </Button>
                          <Input
                            type="number"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value) || 32)}
                            className="text-center h-12 text-base font-semibold"
                            min="8"
                            max="200"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setFontSize(Math.min(200, fontSize + 2))}
                            className="h-12 w-12"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">Color</Label>
                        <div className="flex gap-3">
                          <Input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="h-14 w-20"
                          />
                          <Input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="flex-1 h-14 text-base"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">Transparency: {textOpacity}%</Label>
                        <Slider
                          value={[textOpacity]}
                          onValueChange={(val) => setTextOpacity(val[0])}
                          min={0}
                          max={100}
                          step={1}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">Style</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={textStyle === 'normal' ? 'default' : 'outline'}
                            onClick={() => setTextStyle('normal')}
                            className="flex-1 h-12 text-base"
                          >
                            Normal
                          </Button>
                          <Button
                            variant={textStyle === 'bold' ? 'default' : 'outline'}
                            onClick={() => setTextStyle('bold')}
                            className="flex-1 h-12"
                          >
                            <Bold className="h-5 w-5" />
                          </Button>
                          <Button
                            variant={textStyle === 'italic' ? 'default' : 'outline'}
                            onClick={() => setTextStyle('italic')}
                            className="flex-1 h-12"
                          >
                            <Italic className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Label className="text-base font-semibold">Position in Image</Label>
                        <p className="text-base text-muted-foreground">
                          X: {Math.round(selectedObject.left || 0)}px | Y: {Math.round(selectedObject.top || 0)}px
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Canvas Area */}
                <Card className="p-6 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="font-bold text-xl">Canvas</h3>
                    <Button onClick={downloadCanvas} size="lg" className="h-12 text-base">
                      <Download className="mr-2 h-5 w-5" />
                      Download Design
                    </Button>
                  </div>
                  
                  <div className="border-2 border-dashed border-border rounded-lg overflow-auto bg-muted/20 flex items-center justify-center p-4">
                    <canvas ref={canvasRef} className="max-w-full" />
                  </div>

                  <p className="text-base text-muted-foreground text-center">
                    Drag objects to move • Click text to edit • Use tools on the left
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ImageGen;
