import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Rect, Circle, Triangle, Textbox } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Header from "@/components/Header";
import { 
  Download, 
  Upload, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Triangle as TriangleIcon,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Layers,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function DesignEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    document.title = "Design Editor | ProStudy AI";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Create stunning designs with our powerful visual editor. Add images, text, shapes, and more with drag-and-drop functionality."
      );
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: "#ffffff",
    });

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0]);
      setShowProperties(true);
    });
    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0]);
      setShowProperties(true);
    });
    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
      setShowProperties(false);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;

      // Delete key
      if (e.key === "Delete" && selectedObject) {
        fabricCanvas.remove(selectedObject);
        fabricCanvas.renderAll();
        toast.success("Object deleted");
      }

      // Ctrl/Cmd + D for duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedObject) {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fabricCanvas, selectedObject]);

  // Drag and drop from computer
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !fabricCanvas) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Please drop an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          FabricImage.fromURL(event.target?.result as string).then((img) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            img.set({
              left: x / zoom,
              top: y / zoom,
              scaleX: Math.min(300 / img.width!, 1),
              scaleY: Math.min(300 / img.height!, 1),
            });

            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
            toast.success("Image added!");
          });
        };
        imgElement.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("dragleave", handleDragLeave);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("dragleave", handleDragLeave);
      container.removeEventListener("drop", handleDrop);
    };
  }, [fabricCanvas, zoom]);

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Double click to edit", {
      left: canvasSize.width / 2 - 100,
      top: canvasSize.height / 2 - 20,
      width: 200,
      fontSize: 32,
      fill: "#000000",
      fontFamily: "Arial",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Text added!");
  };

  const addShape = (type: "rectangle" | "circle" | "triangle") => {
    if (!fabricCanvas) return;

    let shape;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    switch (type) {
      case "rectangle":
        shape = new Rect({
          left: centerX - 75,
          top: centerY - 75,
          fill: "#3b82f6",
          width: 150,
          height: 150,
        });
        break;
      case "circle":
        shape = new Circle({
          left: centerX - 75,
          top: centerY - 75,
          fill: "#10b981",
          radius: 75,
        });
        break;
      case "triangle":
        shape = new Triangle({
          left: centerX - 75,
          top: centerY - 75,
          fill: "#f59e0b",
          width: 150,
          height: 150,
        });
        break;
    }

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
    toast.success("Shape added!");
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvas) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          FabricImage.fromURL(event.target?.result as string).then((img) => {
            img.set({
              left: canvasSize.width / 2 - 150,
              top: canvasSize.height / 2 - 150,
              scaleX: Math.min(300 / img.width!, 1),
              scaleY: Math.min(300 / img.height!, 1),
            });

            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
            toast.success("Image uploaded!");
          });
        };
        imgElement.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    toast.success("Object deleted");
  };

  const duplicateSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    selectedObject.clone().then((cloned: any) => {
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast.success("Object duplicated");
    });
  };

  const bringToFront = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.bringObjectToFront(selectedObject);
    fabricCanvas.renderAll();
  };

  const sendToBack = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.sendObjectToBack(selectedObject);
    fabricCanvas.renderAll();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    fabricCanvas?.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    fabricCanvas?.setZoom(newZoom);
  };

  const downloadDesign = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.download = `design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Design downloaded!");
  };

  const updateObjectProperty = (property: string, value: any) => {
    if (!selectedObject || !fabricCanvas) return;

    selectedObject.set(property, value);
    fabricCanvas.renderAll();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={addText}
            className="w-12 h-12 hover:bg-accent"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleImageUpload}
            className="w-12 h-12 hover:bg-accent"
            title="Upload Image"
          >
            <Upload className="w-5 h-5" />
          </Button>

          <Separator className="w-8" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => addShape("rectangle")}
            className="w-12 h-12 hover:bg-accent"
            title="Add Rectangle"
          >
            <Square className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => addShape("circle")}
            className="w-12 h-12 hover:bg-accent"
            title="Add Circle"
          >
            <CircleIcon className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => addShape("triangle")}
            className="w-12 h-12 hover:bg-accent"
            title="Add Triangle"
          >
            <TriangleIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {/* Top Toolbar */}
          <div className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Select
                value={`${canvasSize.width}x${canvasSize.height}`}
                onValueChange={(value) => {
                  const [width, height] = value.split("x").map(Number);
                  setCanvasSize({ width, height });
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920 × 1080</SelectItem>
                  <SelectItem value="1200x800">1200 × 800</SelectItem>
                  <SelectItem value="1080x1080">1080 × 1080</SelectItem>
                  <SelectItem value="1080x1920">1080 × 1920</SelectItem>
                  <SelectItem value="800x600">800 × 600</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Button variant="default" onClick={downloadDesign} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasContainerRef}
            className={`flex-1 flex items-center justify-center p-8 overflow-auto relative ${
              isDragging ? "bg-primary/10 border-2 border-dashed border-primary" : ""
            }`}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-lg font-medium">Drop your image here</p>
                </div>
              </div>
            )}
            
            <div className="shadow-2xl" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <canvas ref={canvasRef} className="border border-border" />
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {showProperties && selectedObject && (
          <div className="w-80 bg-card border-l border-border overflow-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Properties</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProperties(false)}
                  className="h-8 w-8"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={duplicateSelected}
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={deleteSelected}
                    title="Delete (Del)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={bringToFront}
                    title="Bring to Front"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={sendToBack}
                    title="Send to Back"
                  >
                    <Layers className="w-4 h-4 rotate-180" />
                  </Button>
                </div>

                <Separator />

                {/* Position */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">X</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedObject.left || 0)}
                        onChange={(e) => updateObjectProperty("left", Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Y</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedObject.top || 0)}
                        onChange={(e) => updateObjectProperty("top", Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Size</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Width</Label>
                      <Input
                        type="number"
                        value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                        onChange={(e) => {
                          const newWidth = Number(e.target.value);
                          updateObjectProperty("scaleX", newWidth / (selectedObject.width || 1));
                        }}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Height</Label>
                      <Input
                        type="number"
                        value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                        onChange={(e) => {
                          const newHeight = Number(e.target.value);
                          updateObjectProperty("scaleY", newHeight / (selectedObject.height || 1));
                        }}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rotation</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedObject.angle || 0)}
                    onChange={(e) => updateObjectProperty("angle", Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Opacity</Label>
                  <Slider
                    value={[(selectedObject.opacity || 1) * 100]}
                    onValueChange={([value]) => updateObjectProperty("opacity", value / 100)}
                    max={100}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round((selectedObject.opacity || 1) * 100)}%
                  </div>
                </div>

                {/* Text-specific properties */}
                {selectedObject.type === "textbox" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Text</Label>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedObject.fontSize || 20}
                          onChange={(e) => updateObjectProperty("fontSize", Number(e.target.value))}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={selectedObject.fontFamily || "Arial"}
                          onValueChange={(value) => updateObjectProperty("fontFamily", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier">Courier</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Text Color</Label>
                        <Input
                          type="color"
                          value={selectedObject.fill || "#000000"}
                          onChange={(e) => updateObjectProperty("fill", e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Shape-specific properties */}
                {(selectedObject.type === "rect" || selectedObject.type === "circle" || selectedObject.type === "triangle") && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fill Color</Label>
                      <Input
                        type="color"
                        value={selectedObject.fill || "#000000"}
                        onChange={(e) => updateObjectProperty("fill", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
