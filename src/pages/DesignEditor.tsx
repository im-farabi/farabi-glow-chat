import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Rect, Circle, Triangle, Textbox, ActiveSelection } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { 
  Download, 
  Upload, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Triangle as TriangleIcon,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DesignEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    canvas.on("selection:created", (e) => setSelectedObject(e.selected?.[0]));
    canvas.on("selection:updated", (e) => setSelectedObject(e.selected?.[0]));
    canvas.on("selection:cleared", () => setSelectedObject(null));

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasSize]);

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Double click to edit", {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 24,
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
    switch (type) {
      case "rectangle":
        shape = new Rect({
          left: 100,
          top: 100,
          fill: "#3b82f6",
          width: 100,
          height: 100,
        });
        break;
      case "circle":
        shape = new Circle({
          left: 100,
          top: 100,
          fill: "#10b981",
          radius: 50,
        });
        break;
      case "triangle":
        shape = new Triangle({
          left: 100,
          top: 100,
          fill: "#f59e0b",
          width: 100,
          height: 100,
        });
        break;
    }

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
    toast.success("Shape added!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.src = event.target?.result as string;
      imgElement.onload = () => {
        FabricImage.fromURL(imgElement.src).then((img) => {
          img.scaleToWidth(300);
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
          toast.success("Image uploaded!");
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    toast.success("Object deleted!");
  };

  const duplicateSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.clone().then((cloned: any) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast.success("Object duplicated!");
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

  const updateObjectProperty = (property: string, value: any) => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.set(property, value);
    fabricCanvas.renderAll();
  };

  const setTextAlign = (align: string) => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== "textbox") return;
    selectedObject.set("textAlign", align);
    fabricCanvas.renderAll();
  };

  const toggleLock = () => {
    if (!fabricCanvas || !selectedObject) return;
    const isLocked = selectedObject.lockMovementX;
    selectedObject.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      selectable: isLocked,
    });
    fabricCanvas.renderAll();
    toast.success(isLocked ? "Object unlocked!" : "Object locked!");
  };

  const zoomIn = () => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    fabricCanvas.setZoom(zoom * 1.1);
  };

  const zoomOut = () => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    fabricCanvas.setZoom(zoom * 0.9);
  };

  const resetZoom = () => {
    if (!fabricCanvas) return;
    fabricCanvas.setZoom(1);
  };

  const downloadDesign = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = `design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Design downloaded!");
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast.success("Canvas cleared!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Design Editor</h1>
          <p className="text-muted-foreground">Create stunning designs with drag-and-drop editing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-4">
          {/* Left Toolbar */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Tools</h3>
              <div className="space-y-2">
                <Button onClick={addText} variant="outline" className="w-full justify-start">
                  <Type className="mr-2 h-4 w-4" />
                  Add Text
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Shapes</h3>
              <div className="space-y-2">
                <Button onClick={() => addShape("rectangle")} variant="outline" className="w-full justify-start">
                  <Square className="mr-2 h-4 w-4" />
                  Rectangle
                </Button>
                <Button onClick={() => addShape("circle")} variant="outline" className="w-full justify-start">
                  <CircleIcon className="mr-2 h-4 w-4" />
                  Circle
                </Button>
                <Button onClick={() => addShape("triangle")} variant="outline" className="w-full justify-start">
                  <TriangleIcon className="mr-2 h-4 w-4" />
                  Triangle
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Canvas Size</h3>
              <div className="space-y-2">
                <Select
                  value={`${canvasSize.width}x${canvasSize.height}`}
                  onValueChange={(value) => {
                    const [width, height] = value.split("x").map(Number);
                    setCanvasSize({ width, height });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1200x800">1200 x 800 (Default)</SelectItem>
                    <SelectItem value="1920x1080">1920 x 1080 (HD)</SelectItem>
                    <SelectItem value="1080x1080">1080 x 1080 (Square)</SelectItem>
                    <SelectItem value="1080x1920">1080 x 1920 (Story)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button onClick={zoomOut} size="sm" variant="outline">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={resetZoom} size="sm" variant="outline">
                  Reset
                </Button>
                <Button onClick={zoomIn} size="sm" variant="outline">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={clearCanvas} size="sm" variant="outline">
                  Clear
                </Button>
                <Button onClick={downloadDesign} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg">
                <div className="shadow-2xl">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Properties Panel */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Properties</h3>
            
            {selectedObject ? (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={duplicateSelected} size="sm" variant="outline" className="flex-1">
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                    <Button onClick={deleteSelected} size="sm" variant="outline" className="flex-1">
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm">Position X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.left || 0)}
                      onChange={(e) => updateObjectProperty("left", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Position Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.top || 0)}
                      onChange={(e) => updateObjectProperty("top", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  {selectedObject.type !== "textbox" && (
                    <>
                      <div>
                        <Label className="text-sm">Width</Label>
                        <Input
                          type="number"
                          value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                          onChange={(e) => updateObjectProperty("scaleX", Number(e.target.value) / (selectedObject.width || 1))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Height</Label>
                        <Input
                          type="number"
                          value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                          onChange={(e) => updateObjectProperty("scaleY", Number(e.target.value) / (selectedObject.height || 1))}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-sm">Rotation</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={Math.round(selectedObject.angle || 0)}
                        onChange={(e) => updateObjectProperty("angle", Number(e.target.value))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateObjectProperty("angle", (selectedObject.angle || 0) + 45)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Opacity</Label>
                    <Slider
                      value={[(selectedObject.opacity || 1) * 100]}
                      onValueChange={([value]) => updateObjectProperty("opacity", value / 100)}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  {selectedObject.type === "textbox" && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedObject.fontSize || 24}
                          onChange={(e) => updateObjectProperty("fontSize", Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Font Family</Label>
                        <Select
                          value={selectedObject.fontFamily || "Arial"}
                          onValueChange={(value) => updateObjectProperty("fontFamily", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">Text Align</Label>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTextAlign("left")}
                            className="flex-1"
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTextAlign("center")}
                            className="flex-1"
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTextAlign("right")}
                            className="flex-1"
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Text Color</Label>
                        <Input
                          type="color"
                          value={selectedObject.fill || "#000000"}
                          onChange={(e) => updateObjectProperty("fill", e.target.value)}
                          className="mt-1 h-10"
                        />
                      </div>
                    </>
                  )}

                  {selectedObject.type !== "textbox" && (
                    <div>
                      <Label className="text-sm">Fill Color</Label>
                      <Input
                        type="color"
                        value={selectedObject.fill || "#000000"}
                        onChange={(e) => updateObjectProperty("fill", e.target.value)}
                        className="mt-1 h-10"
                      />
                    </div>
                  )}

                  <Separator />

                  <div>
                    <Label className="text-sm mb-2 block">Layer Order</Label>
                    <div className="flex gap-2">
                      <Button onClick={bringToFront} size="sm" variant="outline" className="flex-1">
                        <Layers className="mr-1 h-3 w-3" />
                        Front
                      </Button>
                      <Button onClick={sendToBack} size="sm" variant="outline" className="flex-1">
                        <Layers className="mr-1 h-3 w-3" />
                        Back
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={toggleLock}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {selectedObject.lockMovementX ? (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Lock
                      </>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select an object to edit its properties
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
