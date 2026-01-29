
# Fix Video Generation - Image Upload and Model Issues

## Problem Analysis

After investigating the edge function logs, I've identified these issues:

1. **Image upload fails** - When users add images, the frontend sends base64 data URLs (like `data:image/png;base64,/9j/4AAQ...`) directly to the Pollinations API. The API expects **public HTTP URLs**, not base64 data, causing "Invalid URL" errors.

2. **Video generation actually works** - The logs show successful generation at 10:00:34 with seedance-pro (3.3MB video). Text-only generation is functional.

3. **Some prompts blocked** - Content moderation rejected prompts containing "ishowspeed" due to Vertex AI guidelines.

4. **Documentation clarification**:
   - `veo`: Text-to-video, supports audio, durations 4/6/8s. Image parameter is for frame interpolation (first/last frame)
   - `seedance`/`seedance-pro`: Text-to-video AND image-to-video, durations 2-10s

---

## Solution

### 1. Option A: Upload Images to Temporary Storage (Recommended)
Upload user images to a temporary public storage (like Supabase Storage), then pass the public URL to Pollinations.

**Changes:**
- Create a Supabase Storage bucket for temporary video reference images
- Modify edge function to upload base64 images to storage first
- Get public URLs and pass those to Pollinations
- Clean up images after generation

### 2. Option B: Remove Image Feature for Now
Since image-to-video is complex and requires storage setup, we could:
- Disable image upload for `veo` model (docs say text-to-video only)
- Show clearer messaging about image limitations
- Focus on text-to-video which is working

### 3. Improve Error Handling
- Parse Pollinations error responses properly and show user-friendly messages
- Handle content moderation errors with a clear message

---

## Recommended Implementation Plan

### Files to Modify

**1. `supabase/functions/video-gen/index.ts`**
- Add better error parsing to show actual Pollinations error messages
- Handle base64 images by either:
  - Option A: Upload to Supabase Storage, get public URL, then call API
  - Option B: Skip images for now with clear error message
- Add specific handling for content moderation errors

**2. `src/pages/VideoGen.tsx`**
- Update UI to show clearer messaging:
  - Veo: "Text-to-video with optional audio" (remove 2-image claim if not working)
  - Seedance: "Text-to-video and image-to-video"
- Better error display for content moderation blocks
- Add a note about prompt guidelines

---

## Technical Details

### Error Parsing Improvement
The current error format from Pollinations is:
```json
{
  "success": false,
  "error": {
    "message": "{\"error\":\"Bad Request\",\"message\":\"Video generation failed: ...\"}"
  }
}
```

Need to parse this nested JSON structure to extract the real error message.

### For Image Upload (Option A)
```text
Flow:
1. Frontend sends base64 images
2. Edge function uploads to Supabase Storage
3. Get signed public URL (valid for 1 hour)
4. Pass URL to Pollinations API
5. After video generation, delete temp image
```

---

## Summary

| File | Changes |
|------|---------|
| `supabase/functions/video-gen/index.ts` | Better error parsing, handle images properly |
| `src/pages/VideoGen.tsx` | Update model descriptions, better error display |
| (Optional) Create storage bucket | For temporary image hosting |
