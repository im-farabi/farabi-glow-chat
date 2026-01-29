
# Video Generator Feature Implementation

## Overview
Create a new Video Generator page accessible from the main Index page, with support for multiple AI models (Veo, Seedance, Seedance Pro), text-to-video and image-to-video generation, customizable aspect ratios, durations, and an intuitive image upload interface.

---

## Research Findings

### Available Video Models (from Pollinations API)
| Model | Features | Duration | Cost |
|-------|----------|----------|------|
| **veo** | Text-to-video, Image-to-video (2 images for interpolation), Audio support | 4, 6, 8 sec | 0.150 pollen/sec |
| **seedance** | Text-to-video, Image-to-video (single image reference) | 2-10 sec | 1.8M pollen |
| **seedance-pro** | Higher quality version of Seedance | 2-10 sec | 1.0M pollen |

### API Endpoint Structure
```
GET https://gen.pollinations.ai/image/{prompt}?model=veo&key=API_KEY
  &duration=6           # veo: 4,6,8 | seedance: 2-10
  &aspectRatio=16:9     # 16:9 or 9:16
  &audio=true           # veo only
  &image=url1,url2      # veo: first/last frame interpolation
                        # seedance: single reference image
  &seed=12345
  &nologo=true
```

### Key Features to Implement
1. Image-to-video with Veo (2 images = first frame + last frame interpolation)
2. Image-to-video with Seedance (single reference image)
3. Audio toggle for Veo
4. Model-specific duration ranges
5. Drag-and-drop/paste image upload

---

## Files to Create

### 1. `src/pages/VideoGen.tsx`
New video generator page with:
- Prompt textarea
- Image upload zone (up to 2 images for Veo, 1 for Seedance)
  - Supports drag-and-drop, click-to-upload, and paste
  - Image preview with remove button
- Model selector (Veo 3.1 Fast, Seedance, Seedance Pro)
- Aspect ratio selector (16:9, 9:16, 1:1)
- Duration selector (dynamic based on model)
- Audio toggle (Veo only)
- Seed input (optional)
- Generate button with loading state
- Video preview with download/regenerate buttons
- Experimental warning banner

### 2. `supabase/functions/video-gen/index.ts`
New edge function that:
- Accepts prompt, model, duration, aspectRatio, audio, images, seed
- Uses existing `NEW_POLLINATIONS_APIKEY_1` secret
- Builds correct GET URL for Pollinations API
- Handles image URLs for image-to-video
- Returns video as base64 data URL
- Proper error handling and logging

---

## Files to Modify

### 3. `src/pages/Index.tsx`
Add Video Gen button in the top action bar area (similar to Grammify placement):
- Add Video icon import from lucide-react
- Add Link to `/video-gen` with NEW badge

### 4. `src/components/Sidebar.tsx`
Add Video Generator link after Grammify in the sidebar:
- Add Video icon import
- Add Link button to `/video-gen` with NEW badge

### 5. `src/App.tsx`
Add route for the new page:
- Import VideoGen component
- Add route `/video-gen`

### 6. `supabase/config.toml`
Register the new edge function:
- Add `[functions.video-gen]` with `verify_jwt = false`

---

## Technical Details

### Image Upload Component
```text
+------------------------------------------+
|  +  Add Images (max 2 for Veo, 1 other)  |
|                                          |
|   Drag & drop, paste, or click           |
+------------------------------------------+
| [img1 preview] [X]  [img2 preview] [X]   |
+------------------------------------------+
```

### Model-Specific UI Logic
- **Veo selected**: Show audio toggle, duration options (4/6/8), allow 2 images
- **Seedance/Pro selected**: Hide audio toggle, duration slider (2-10), allow 1 image

### Edge Function Flow
```text
1. Parse request body
2. Get API key from secrets
3. Build URL with model, prompt, params
4. If images provided: upload to temp storage or use base64 URLs
5. Fetch video from Pollinations
6. Convert to base64
7. Return as JSON { videoUrl: "data:video/mp4;base64,..." }
```

### Error Handling
- 402: Insufficient pollen balance
- 403: Model access denied
- 500: Generation failed
- Display user-friendly error messages

---

## UI Design

### Page Layout
```text
+--------------------------------------------------+
| [Back] [Video icon] AI Video Generator           |
+--------------------------------------------------+
| [!] Experimental - Results may vary              |
+--------------------------------------------------+
| Model: [Veo 3.1 Fast v] [Seedance] [Seedance Pro]|
+--------------------------------------------------+
| Describe your video:                             |
| +----------------------------------------------+ |
| | A cat playing piano in a jazz club...        | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| Reference Images (optional):                     |
| +----------------------------------------------+ |
| | [+] Drag, paste or click to add images       | |
| |     (2 max for Veo frame interpolation)      | |
| +----------------------------------------------+ |
| | [img1] [X]    [img2] [X]                     | |
+--------------------------------------------------+
| Duration: [6 sec v]  Aspect: [16:9 v]  Seed: [] |
| [ ] Generate with audio (Veo only)               |
+--------------------------------------------------+
| [=== Generate Video ===]                         |
+--------------------------------------------------+
| [Video Player]                                   |
| [Download] [Regenerate]                          |
+--------------------------------------------------+
```

### Styling
- Match existing Grammify/ImageGen aesthetic
- Purple/violet gradient theme (consistent with NewVideo.tsx)
- PremiumBackground component
- Card components with backdrop blur

---

## Summary

| Component | Action |
|-----------|--------|
| `src/pages/VideoGen.tsx` | Create - Full video gen page with image upload |
| `supabase/functions/video-gen/index.ts` | Create - Edge function for video generation |
| `src/pages/Index.tsx` | Modify - Add Video Gen button in header area |
| `src/components/Sidebar.tsx` | Modify - Add Video Gen link with NEW badge |
| `src/App.tsx` | Modify - Add `/video-gen` route |
| `supabase/config.toml` | Modify - Register video-gen function |
