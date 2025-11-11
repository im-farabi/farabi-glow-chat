import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageEditorProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export const ImageEditor = ({ image, isOpen, onClose, onSave }: ImageEditorProps) => {
  const [text, setText] = useState('farabi.me');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontWeight, setFontWeight] = useState<'300' | '400' | '700'>('400');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textColor, setTextColor] = useState('#808080');
  const [transparency, setTransparency] = useState(100);
  const [position, setPosition] = useState<'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('bottom-left');
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const drawImageWithText = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = transparency / 100;
      
      if (shadowEnabled) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      let x, y;
      const padding = 20;
      
      switch (position) {
        case 'top-left':
          x = padding;
          y = padding + textHeight;
          break;
        case 'top-center':
          x = (canvas.width - textWidth) / 2;
          y = padding + textHeight;
          break;
        case 'top-right':
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
          break;
        case 'middle-left':
          x = padding;
          y = (canvas.height + textHeight) / 2;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height + textHeight) / 2;
          break;
        case 'middle-right':
          x = canvas.width - textWidth - padding;
          y = (canvas.height + textHeight) / 2;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - padding;
          break;
        case 'bottom-center':
          x = (canvas.width - textWidth) / 2;
          y = canvas.height - padding;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
      }
      
      ctx.fillText(text, x, y);
    };
    
    img.src = image;
  }, [image, text, fontSize, fontFamily, fontWeight, fontStyle, textColor, transparency, position, shadowEnabled, shadowColor]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        drawImageWithText();
      }, 50);
    }
  }, [isOpen, drawImageWithText]);

  const basicPositions = [
    { value: 'bottom-left', label: '↙ Bottom Left' },
    { value: 'bottom-right', label: '↘ Bottom Right' },
    { value: 'top-left', label: '↖ Top Left' },
    { value: 'center', label: '• Center' },
  ];

  const additionalPositions = [
    { value: 'top-center', label: '↑ Top Center' },
    { value: 'top-right', label: '↗ Top Right' },
    { value: 'middle-left', label: '← Middle Left' },
    { value: 'middle-right', label: '→ Middle Right' },
    { value: 'bottom-center', label: '↓ Bottom Center' },
  ];

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      onSave(url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success!',
        description: 'Edited image saved',
      });
      
      onClose();
    }, 'image/png');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Add custom text overlay to your image
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview - Left side */}
          <div className="space-y-2 order-2 lg:order-1">
            <Label>Preview</Label>
            <div className="border border-border rounded-lg overflow-hidden bg-muted">
              <canvas 
                ref={canvasRef} 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Controls - Right side */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Settings</h3>
              
              <div className="space-y-2">
                <Label>Text</Label>
                <Input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#808080"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size: {fontSize}px</Label>
                <Slider 
                  value={[fontSize]}
                  onValueChange={([val]) => setFontSize(val)}
                  min={12}
                  max={200}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Text Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {basicPositions.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={position === value ? 'default' : 'outline'}
                      onClick={() => setPosition(value as any)}
                      size="sm"
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                
                {!showAllPositions && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllPositions(true)}
                    className="w-full text-xs"
                    size="sm"
                  >
                    Load More Positions
                  </Button>
                )}
                
                {showAllPositions && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {additionalPositions.map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={position === value ? 'default' : 'outline'}
                        onClick={() => setPosition(value as any)}
                        size="sm"
                        className="text-xs"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  <span className="font-semibold">Advanced Settings</span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Shadow Settings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={shadowEnabled}
                      onChange={(e) => setShadowEnabled(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <Label className="cursor-pointer">Enable Text Shadow</Label>
                  </div>
                  {shadowEnabled && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-xs text-muted-foreground">Shadow Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input 
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Transparency */}
                <div className="space-y-2">
                  <Label>Transparency: {transparency}%</Label>
                  <Slider 
                    value={[transparency]}
                    onValueChange={([val]) => setTransparency(val)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                
                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Font Weight */}
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={fontWeight === '300' ? 'default' : 'outline'}
                      onClick={() => setFontWeight('300')}
                      size="sm"
                    >
                      Light
                    </Button>
                    <Button
                      variant={fontWeight === '400' ? 'default' : 'outline'}
                      onClick={() => setFontWeight('400')}
                      size="sm"
                    >
                      Regular
                    </Button>
                    <Button
                      variant={fontWeight === '700' ? 'default' : 'outline'}
                      onClick={() => setFontWeight('700')}
                      size="sm"
                    >
                      Bold
                    </Button>
                  </div>
                </div>
                
                {/* Font Style */}
                <div className="space-y-2">
                  <Label>Font Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={fontStyle === 'normal' ? 'default' : 'outline'}
                      onClick={() => setFontStyle('normal')}
                      size="sm"
                    >
                      Normal
                    </Button>
                    <Button
                      variant={fontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={() => setFontStyle('italic')}
                      size="sm"
                    >
                      Italic
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            Save Edited Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
