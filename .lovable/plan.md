

# Image Generator Improvements

## Overview

Two features requested:
1. **Multiple reference images** - Research the API to see if it's possible
2. **Full-screen image preview** - Add a modal/lightbox to view generated images larger

---

## 1. Multiple Reference Images - API Research Results

### Finding

The Pollinations image generation GET endpoint **only supports 1 reference image** via the `&image={url}` query parameter.

From the official API docs:
```
GET https://gen.pollinations.ai/image/{prompt}?model=flux&image=https://example.com/input-image.jpg
```
- The `image` parameter is singular
- Models that support image input have `"input_modalities": ["text", "image"]` (singular)

### Alternative for Multi-Image

To use **multiple reference images**, you would need to switch to the **POST chat completions endpoint** with models like `nanobanana` (Gemini 2.5 Flash Image):

```json
POST /v1/chat/completions
{
  "model": "nanobanana",
  "messages": [{
    "role": "user", 
    "content": [
      { "type": "text", "text": "Combine these two people in a photo together" },
      { "type": "image_url", "image_url": { "url": "https://example.com/person1.jpg" }},
      { "type": "image_url", "image_url": { "url": "https://example.com/person2.jpg" }}
    ]
  }],
  "modalities": ["image", "text"]
}
```

This is a fundamentally different architecture and would only work with specific models (nanobanana, nanobanana-pro, gptimage, gptimage-large).

### Recommendation

Multi-image support requires a significant refactor:
- New edge function using POST endpoint instead of GET
- Only works with ~4 models (not all 5 currently used)
- Different response format (base64 images in JSON)

**This is possible but would be a separate, larger feature.**

---

## 2. Full-Screen Image Preview (Lightbox)

### Current Behavior
- Generated images show in a grid
- On hover, shows download/copy/regenerate buttons
- No way to view the image larger

### Proposed Behavior
- **Click on any generated image** to open it in a full-screen modal
- Modal shows:
  - Large image preview (full screen)
  - Model name badge
  - Action buttons (Download, Copy, Regenerate, Close)
  - Prompt text at the bottom
- Click outside or X button to close

---

## Technical Implementation

### Changes to `src/pages/ImageGen.tsx`

#### 1. Add State for Selected Image

```typescript
const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
```

#### 2. Add Image Lightbox Modal

Using Dialog component for full-screen overlay:

```typescript
<Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
  <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-green-500/30">
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSelectedImage(null)}
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>
      
      {/* Image */}
      <img 
        src={selectedImage?.imageUrl || ''} 
        alt="Preview"
        className="max-w-full max-h-[80vh] object-contain rounded-lg"
      />
      
      {/* Model badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40">
        <span className="text-sm text-green-300">{selectedImage?.modelName}</span>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={() => downloadImage(selectedImage?.imageUrl, 0)}>
          <Download className="w-4 h-4 mr-2" /> Download
        </Button>
        <Button variant="outline" onClick={() => copyImage(selectedImage?.imageUrl, 0)}>
          <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
        <Button variant="outline" onClick={() => {
          const idx = generatedImages.findIndex(i => i.id === selectedImage?.id);
          if (idx >= 0) regenerateSingle(idx);
          setSelectedImage(null);
        }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
        </Button>
      </div>
      
      {/* Prompt */}
      <p className="text-sm text-gray-400 mt-4 text-center max-w-2xl">
        "{prompt}"
      </p>
    </div>
  </DialogContent>
</Dialog>
```

#### 3. Make Image Cards Clickable

Update the image in the grid to open the modal:

```typescript
<img 
  src={img.imageUrl} 
  alt={`Generated ${index + 1}`}
  className="w-full h-full object-cover cursor-pointer"
  onClick={() => setSelectedImage(img)}
/>
```

---

## Summary

| Feature | Status | Effort |
|---------|--------|--------|
| Multiple reference images | **Not supported** by GET endpoint; requires POST endpoint refactor | Large (future) |
| Full-screen image preview | **Ready to implement** | Small |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ImageGen.tsx` | Add Dialog component, selectedImage state, click handlers |

---

## UI Flow After Implementation

1. User generates 5 images
2. User sees grid of thumbnails with model names
3. **User clicks on any image** → Full-screen modal opens
4. Modal shows:
   - Large image
   - Model name (top left badge)
   - Action buttons (Download, Copy, Regenerate)
   - Prompt text
5. Click X or outside to close

