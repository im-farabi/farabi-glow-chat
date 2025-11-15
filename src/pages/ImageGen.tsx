import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, History, Trash2, Wand2, Sparkles, Type, Upload, Palette, Plus, Minus, Bold, Italic, MoveHorizontal, MoveVertical } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendNormal } from '@/lib/api';
import { getImageHistory, saveImageToHistory, deleteImageFromHistory, ImageHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Canvas as FabricCanvas, FabricImage, FabricText } from 'fabric';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';

const FONTS = ['Montserrat', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Inter'];

const ImageGen = () => {
  useEffect(() => {
    document.title = "AI Image Generator - Farabi's AI Chatbot | Free Image Generation";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI images from text prompts for free. Create banners, logos, and custom images using advanced AI models. No signup required.');
    }
  }, []);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'text' | 'upload'>('design');
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setHistory(getImageHistory());
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);
    canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0]));
    canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0]));
    canvas.on('selection:cleared', () => setSelectedObject(null));

    return () => {
      canvas.dispose();
    };
  }, [canvasSize]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedObject) {
        fabricCanvas.remove(selectedObject);
        fabricCanvas.renderAll();
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (selectedObject) {
          selectedObject.clone((cloned: any) => {
            cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
            fabricCanvas.add(cloned);
            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.renderAll();
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, selectedObject]);

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

  const generateImage = async () => {
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
    setStatus('Generating image...');
    const seed = Math.floor(Math.random() * 1000000);

    try {
      const { data, error } = await supabase.functions.invoke('pollinations-image', {
        body: { 
          prompt: trimmedPrompt,
          width: canvasSize.width,
          height: canvasSize.height,
          seed,
          nologo: true,
          enhance: false
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        addImageToCanvas(data.imageUrl);
        
        saveImageToHistory({
          url: data.imageUrl,
          prompt: trimmedPrompt,
          width: canvasSize.width,
          height: canvasSize.height,
          seed
        });
        setHistory(getImageHistory());
        
        toast({
          title: 'Image Generated!',
          description: 'Image added to canvas',
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const addImageToCanvas = (imageUrl: string) => {
    if (!fabricCanvas) return;

    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      const scale = Math.min(
        canvasSize.width / (img.width || 1) * 0.8,
        canvasSize.height / (img.height || 1) * 0.8
      );
      
      img.scale(scale);
      img.set({
        left: (canvasSize.width - (img.width || 0) * scale) / 2,
        top: (canvasSize.height - (img.height || 0) * scale) / 2,
      });
      
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
    });
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new FabricText('Add a text', {
      left: 100,
      top: 100,
      fontSize: 40,
      fontFamily: 'Montserrat',
      fill: '#000000',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      addImageToCanvas(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateObjectProperty = (property: string, value: any) => {
    if (!selectedObject || !fabricCanvas) return;

    selectedObject.set(property, value);
    fabricCanvas.renderAll();
  };

  const downloadCanvas = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `farabi-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast({
      title: 'Downloaded!',
      description: 'Your design has been saved',
    });
  };

  const loadFromHistory = (item: ImageHistoryItem) => {
    addImageToCanvas(item.url);
    setPrompt(item.prompt);
    setIsHistoryOpen(false);
    toast({
      title: 'Loaded!',
      description: 'Image loaded from history',
    });
  };

  const deleteHistoryItem = (id: string) => {
    deleteImageFromHistory(id);
    setHistory(getImageHistory());
    toast({
      title: 'Deleted!',
      description: 'History item removed',
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <aside className="w-full lg:w-16 border-b lg:border-r border-border bg-card flex lg:flex-col items-center gap-2 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'design' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveTab('design')}
                  className="w-12 h-12"
                >
                  <Palette className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Generate Design</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'text' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveTab('text')}
                  className="w-12 h-12"
                >
                  <Type className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Text</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'upload' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveTab('upload')}
                  className="w-12 h-12"
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Upload Image</TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-12 h-12">
                      <History className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">History</TooltipContent>
                </Tooltip>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Generation History</SheetTitle>
                  <SheetDescription>Click any image to load it onto the canvas</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No history yet. Generate your first image!</p>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="group relative border border-border rounded-lg overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.prompt}
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => loadFromHistory(item)}
                          />
                          <div className="p-3 space-y-2">
                            <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.width}x{item.height}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHistoryItem(item.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </aside>

          <aside className="w-full lg:w-80 border-b lg:border-r border-border bg-card p-4 space-y-4 overflow-y-auto">
            {activeTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    placeholder="Type prompt to generate image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] mt-2"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Canvas Size</Label>
                  <Select
                    value={`${canvasSize.width}x${canvasSize.height}`}
                    onValueChange={(value) => {
                      const [w, h] = value.split('x').map(Number);
                      setCanvasSize({ width: w, height: h });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                      <SelectItem value="1920x1080">Landscape (1920x1080)</SelectItem>
                      <SelectItem value="1080x1920">Portrait (1080x1920)</SelectItem>
                      <SelectItem value="1280x720">HD (1280x720)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={enhancePrompt} disabled={loading || !prompt.trim()} variant="outline" className="flex-1">
                    {loading && status.includes('Enhancing') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Enhance
                  </Button>
                  <Button onClick={generateImage} disabled={loading || !prompt.trim()} className="flex-1">
                    {loading && status.includes('Generating') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate
                  </Button>
                </div>

                {loading && status && <p className="text-sm text-muted-foreground text-center">{status}</p>}

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">💡 <strong>Tip:</strong> Generated images automatically appear on the canvas. Drag and drop to position them!</p>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <Button onClick={addText} className="w-full"><Plus className="mr-2 h-4 w-4" />Add a text</Button>

                <div>
                  <Label className="mb-2 block">Font Templates</Label>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {FONTS.map((font) => (
                        <Button key={font} variant="outline" className="w-full justify-start" style={{ fontFamily: font }} onClick={() => {
                          if (selectedObject && selectedObject.type === 'textbox') {
                            updateObjectProperty('fontFamily', font);
                          } else {
                            addText();
                          }
                        }}>
                          {font}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">💡 <strong>Tip:</strong> Add text to your canvas, then select it to customize font, size, and colors in the top toolbar!</p>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-4">
                <Label>Upload Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                <p className="text-sm text-muted-foreground">Upload your own images to add to the canvas. Supports JPG, PNG, WEBP, and more.</p>
              </div>
            )}
          </aside>

          <div className="flex-1 flex flex-col bg-muted/30">
            {selectedObject && (
              <div className="border-b border-border bg-card p-3">
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2 min-w-max">
                    {selectedObject.type === 'textbox' && (
                      <>
                        <Select value={selectedObject.fontFamily} onValueChange={(value) => updateObjectProperty('fontFamily', value)}>
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map((font) => (
                              <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1 border border-input rounded-md">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateObjectProperty('fontSize', Math.max(8, (selectedObject.fontSize || 20) - 2))}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input type="number" value={Math.round(selectedObject.fontSize || 20)} onChange={(e) => updateObjectProperty('fontSize', Number(e.target.value))} className="w-16 h-8 text-center border-0 focus-visible:ring-0" />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateObjectProperty('fontSize', (selectedObject.fontSize || 20) + 2)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Input type="color" value={selectedObject.fill || '#000000'} onChange={(e) => updateObjectProperty('fill', e.target.value)} className="w-12 h-8 p-1 cursor-pointer" />

                        <Button variant={selectedObject.fontWeight === 'bold' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => updateObjectProperty('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}>
                          <Bold className="h-4 w-4" />
                        </Button>

                        <Button variant={selectedObject.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => updateObjectProperty('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}>
                          <Italic className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    <div className="h-6 w-px bg-border mx-1" />

                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Opacity:</Label>
                      <Slider value={[(selectedObject.opacity || 1) * 100]} onValueChange={([value]) => updateObjectProperty('opacity', value / 100)} max={100} step={1} className="w-24" />
                      <span className="text-xs w-8 text-right">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <div className="flex items-center gap-1">
                      <MoveHorizontal className="h-3 w-3 text-muted-foreground" />
                      <Input type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => updateObjectProperty('left', Number(e.target.value))} className="w-16 h-8 text-sm" />
                    </div>

                    <div className="flex items-center gap-1">
                      <MoveVertical className="h-3 w-3 text-muted-foreground" />
                      <Input type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => updateObjectProperty('top', Number(e.target.value))} className="w-16 h-8 text-sm" />
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button variant="destructive" size="sm" onClick={() => {
                      if (fabricCanvas && selectedObject) {
                        fabricCanvas.remove(selectedObject);
                        fabricCanvas.renderAll();
                      }
                    }}>
                      <Trash2 className="h-4 w-4 mr-1" />Delete
                    </Button>
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
              <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                <canvas ref={canvasRef} className="border border-border shadow-lg" />
              </div>
            </div>

            <div className="border-t border-border bg-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}><Minus className="h-4 w-4" /></Button>
                <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}><Plus className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(1)}>Reset</Button>
              </div>

              <Button onClick={downloadCanvas}><Download className="mr-2 h-4 w-4" />Download Design</Button>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default ImageGen;
