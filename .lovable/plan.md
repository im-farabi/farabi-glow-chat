

# Complete Rebuild: AI Image Generator

## Summary
Remove the existing `/image-gen` page and build a new modern image generator from scratch with:
- Green/black premium theme matching the main chat (`/`)
- 5 AI models to choose from
- 5 parallel image generations per prompt
- Image upload via drag & drop, paste, or button

---

## Models to Support

| Model Name | API Parameter | Notes |
|------------|---------------|-------|
| Seedream 4.5 Pro | `seedream-pro` | Premium quality |
| FLUX.2 Klein 9B | `klein-large` | High detail |
| GPT Image 1.5 | `gptimage-large` | Supports transparency |
| Seedream 4.0 | `seedream` | Good balance |
| FLUX.2 Klein 4B | `klein` | Faster generation |

---

## Architecture

```text
User Input (prompt + optional image)
         │
         ▼
┌────────────────────────────────┐
│ New Edge Function:             │
│ image-gen-multi/index.ts       │
│                                │
│ - Receives: prompt, model,     │
│   count, seed, imageUrl        │
│ - Calls Pollinations API 5x    │
│   in parallel                  │
│ - Returns: array of image URLs │
└────────────────────────────────┘
         │
         ▼
   5 Images Displayed
```

---

## Changes Required

### 1. Delete Existing Files

| Action | File |
|--------|------|
| Delete | `src/pages/ImageGen.tsx` (will rewrite completely) |
| Keep | `src/components/ImageEditor.tsx` (for potential future use) |
| Keep | `supabase/functions/pollinations-image/` (for other features) |

### 2. Create New Edge Function

**File:** `supabase/functions/image-gen-multi/index.ts`

- Accepts: `prompt`, `model`, `imageUrl` (optional reference), `count` (default 5)
- Uses `NEW_POLLINATIONS_APIKEY_1` from secrets
- Generates 5 images in parallel with different seeds
- Returns array of image URLs or base64 data

```text
POST /functions/v1/image-gen-multi
{
  "prompt": "a cat in space",
  "model": "seedream-pro",
  "imageUrl": "https://..." (optional),
  "count": 5
}
```

### 3. Create New ImageGen Page

**File:** `src/pages/ImageGen.tsx` (complete rewrite)

**Features:**
- Green/black theme with animated gradient background
- Model selector dropdown (5 models)
- Prompt textarea with character counter
- Image upload area:
  - Drag & drop zone
  - Paste support (Ctrl+V)
  - Plus (+) button for file picker
- Generate button
- Grid display of 5 generated images
- Each image shows:
  - Loading skeleton while generating
  - Hover actions: Download, Copy, Regenerate
- History panel (reuse localStorage pattern)

**Theme Colors:**
- Background: Black with green particle effects
- Accent: Green gradient (`from-green-400 to-emerald-500`)
- Cards: Glassmorphic with green borders
- Buttons: Green gradient

### 4. Add New Background Component

**File:** `src/components/GreenBackground.tsx`

Same pattern as `PremiumBackground.tsx` but with green/emerald colors instead of pink/purple.

### 5. Update Storage Functions

**File:** `src/lib/storage.ts`

Update `ImageHistoryItem` to support:
- Multiple images per generation
- Model used
- Reference image (if any)

### 6. Update Config

**File:** `supabase/config.toml`

Add entry for new edge function:
```toml
[functions.image-gen-multi]
verify_jwt = false
```

---

## UI Layout

```text
┌─────────────────────────────────────────────────────────┐
│  Header (FARABI.me logo)                        [Video] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ← Back to Chat                           [History 📖]  │
│                                                         │
│  🖼️ AI Image Generator                                  │
│  Generate stunning AI images with multiple models       │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Model: [ Seedream 4.5 Pro ▼ ]                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │                                              │  │ │
│  │  │    📤 Drop image here, paste, or click +     │  │ │
│  │  │                                              │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  Preview: [uploaded image thumbnail]              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  Describe your image...                  [✨ AI]  │ │
│  │  ________________________________________________ │ │
│  │                                                    │ │
│  │                              123/500    [Generate] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Generated Images                                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │              │
│  │     │ │     │ │     │ │     │ │     │              │
│  │     │ │     │ │     │ │     │ │     │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Image Upload Handling

### Drag & Drop
```typescript
onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
onDragLeave={() => setDragActive(false)}
onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
```

### Paste Support
```typescript
useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFiles([file]);
      }
    }
  };
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, []);
```

### File to Base64
Convert uploaded images to base64 for the API, or upload to temp storage.

---

## Parallel Generation Logic

```typescript
const generateImages = async () => {
  setLoading(true);
  
  // Create 5 parallel requests with different seeds
  const promises = Array.from({ length: 5 }, (_, i) => 
    supabase.functions.invoke('image-gen-multi', {
      body: {
        prompt,
        model: selectedModel,
        seed: Date.now() + i * 1000,
        imageUrl: uploadedImageUrl
      }
    })
  );
  
  // Process results as they arrive
  const results = await Promise.allSettled(promises);
  // Update UI progressively
};
```

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/functions/image-gen-multi/index.ts` | New edge function for parallel image gen |
| Rewrite | `src/pages/ImageGen.tsx` | Complete rebuild with new design |
| Create | `src/components/GreenBackground.tsx` | Green-themed particle background |
| Update | `src/lib/storage.ts` | Enhanced image history types |
| Update | `supabase/config.toml` | Add function config |

---

## Expected Behavior

1. User visits `/image-gen`
2. Sees green/black themed page with model selector
3. Can optionally upload a reference image (drag/drop/paste/click)
4. Types prompt and clicks Generate
5. 5 images start generating simultaneously with loading skeletons
6. Images appear as they complete (1st, 2nd, 3rd, etc.)
7. Can download, copy, or regenerate individual images
8. Generation saved to history

