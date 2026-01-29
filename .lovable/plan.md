

# Add Wan 2.6 Model to Video Generator

## Research Findings: Wan 2.6 Capabilities

Based on Pollinations API documentation and official Wan 2.6 specs:

### Wan 2.6 Key Features (from Alibaba)
| Feature | Description |
|---------|-------------|
| **Duration** | Up to 15 seconds (industry-leading) |
| **Resolution** | 720p, 1080p |
| **Native AV Sync** | Audio generation with lip-sync |
| **Multi-shot Narrative** | Smart storyboard from prompts (auto scene segmentation) |
| **Video Roleplay** | Character consistency from reference video |
| **Aspect Ratios** | 16:9, 9:16, 1:1, 4:3, 3:4 |

### Wan 2.6 Three Modes
1. **Text-to-Video (T2V)**: Pure text prompts to video
2. **Image-to-Video (I2V)**: Animate static images (5-15 seconds)
3. **Reference-to-Video (R2V)**: Maintain character consistency using 1-3 reference videos

### What Pollinations Supports for `wan`
From the GitHub announcement (2026-01-26):
> "Generate videos from images with audio support using the new `wan` model"

Based on Pollinations `/image/{prompt}` endpoint documentation:
- Model: `wan` (similar to veo, seedance)
- Duration: Likely 5-15 seconds
- Audio: Supported
- Image: Supported (image-to-video)
- Aspect Ratio: 16:9, 9:16, etc.

---

## Implementation Plan

### 1. Add Wan Model to `ModelType` and Config

**File: `src/pages/VideoGen.tsx`**

Add "wan" to the model type and configuration:

```typescript
type ModelType = 'veo' | 'seedance' | 'seedance-pro' | 'wan';

const modelConfigs = {
  veo: { maxImages: 2, durations: [4, 6, 8], hasAudio: true, label: 'Veo 3.1 Fast' },
  seedance: { maxImages: 1, durations: [2, 3, 4, 5, 6, 7, 8, 9, 10], hasAudio: false, label: 'Seedance' },
  'seedance-pro': { maxImages: 1, durations: [2, 3, 4, 5, 6, 7, 8, 9, 10], hasAudio: false, label: 'Seedance Pro' },
  wan: { maxImages: 1, durations: [5, 10, 15], hasAudio: true, label: 'Wan 2.6' },
};
```

### 2. Add More Aspect Ratio Options

Wan 2.6 supports 5 aspect ratios. Add 4:3 and 3:4 options:

```tsx
<SelectContent>
  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
  <SelectItem value="1:1">1:1 (Square)</SelectItem>
  <SelectItem value="4:3">4:3 (Classic)</SelectItem>
  <SelectItem value="3:4">3:4 (Portrait Classic)</SelectItem>
</SelectContent>
```

### 3. Update Edge Function for Wan Model

**File: `supabase/functions/video-gen/index.ts`**

The edge function should already work since it passes the `model` param dynamically. However, add audio support for Wan:

```typescript
// Add audio for Veo and Wan models
if (audio && (model === 'veo' || model === 'wan')) {
  url += `&audio=true`;
}
```

### 4. Update Enhance Prompt Function for Wan

**File: `supabase/functions/enhance-video-prompt/index.ts`**

Add Wan-specific system prompt formula:

**Wan 2.6 Prompt Formula** (based on research):
```
[Shot Type] + [Subject with Details] + [Motion/Action] + [Scene/Environment] + [Lighting/Style]
```

Wan excels at:
- Multi-shot narratives with temporal markers
- Cinematic language (close-up, wide shot, tracking)
- Audio descriptions when audio is enabled

### 5. Update UI Descriptions

**File: `src/pages/VideoGen.tsx`**

Add description for Wan model in the Reference Images card:
```tsx
{model === 'wan' 
  ? 'Wan 2.6 supports image-to-video animation with native audio sync'
  : model === 'veo' 
  ? 'Veo supports text-to-video with optional audio...'
  : 'Add 1 reference image to guide the video style...'}
```

### 6. Add "NEW" Badge for Wan

Show a badge next to the Wan button since it's a new addition.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/VideoGen.tsx` | Add Wan model type, config, aspect ratios, UI descriptions |
| `supabase/functions/video-gen/index.ts` | Add audio support for Wan model |
| `supabase/functions/enhance-video-prompt/index.ts` | Add Wan-specific prompt optimization |

---

## Technical Details

### Wan Model Configuration
```typescript
wan: { 
  maxImages: 1,        // I2V supports single image
  durations: [5, 10, 15],  // Up to 15 seconds!
  hasAudio: true,      // Native AV sync
  label: 'Wan 2.6'
}
```

### Wan Prompt System (for enhance function)
```text
You are an expert video prompt engineer for Alibaba Wan 2.6. Transform basic prompts using:

[Shot Type] + [Subject Details] + [Motion/Action] + [Scene] + [Style]

Key techniques for Wan:
- Use multi-shot syntax: "Shot 1 [0-5s]: ..., Shot 2 [5-10s]: ..."
- Include camera movements: tracking, pan, zoom, close-up, wide shot
- Describe motion with adverbs: gracefully, rapidly, slowly
- For audio: describe sounds, dialogue in quotes, ambient audio
{If image provided: Focus on animating the image content}

Keep under 200 words. Output ONLY the enhanced prompt.
```

---

## Summary

| Addition | Description |
|----------|-------------|
| Wan 2.6 model | New model option with 5-15s duration and audio |
| Extended aspect ratios | 4:3 and 3:4 options |
| Wan prompt optimization | Model-specific enhancement in edge function |
| Updated UI | Descriptions and NEW badge for Wan |

