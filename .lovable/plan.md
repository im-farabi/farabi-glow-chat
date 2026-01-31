

# Fix Image Generator Issues

## Problems Identified

1. **`seedream-pro` is a paid model** - Costs 0.04 pollen per image, needs to be removed
2. **"No prompt provided" errors** - Appears in logs but seems to be from stray requests, not affecting main flow
3. **Prompt enhancer is too simple** - Needs full context-aware instructions restored

---

## Changes Required

### 1. File: `src/pages/ImageGen.tsx` - Update Models List

**Current (line 17-23):**
```typescript
const MODELS = [
  { id: 'seedream-pro', name: 'Seedream 4.5 Pro', description: 'Premium quality' },  // ❌ PAID
  { id: 'klein-large', name: 'FLUX.2 Klein 9B', description: 'High detail' },
  { id: 'gptimage-large', name: 'GPT Image 1.5', description: 'Transparency support' },
  { id: 'seedream', name: 'Seedream 4.0', description: 'Good balance' },
  { id: 'klein', name: 'FLUX.2 Klein 4B', description: 'Faster generation' },
];
```

**Replace with (4 free/cheap models):**
```typescript
const MODELS = [
  { id: 'flux', name: 'Flux Schnell', description: 'Fast & high quality' },
  { id: 'klein-large', name: 'FLUX.2 Klein 9B', description: 'High detail editing' },
  { id: 'gptimage-large', name: 'GPT Image 1.5', description: 'OpenAI quality' },
  { id: 'seedream', name: 'Seedream 4.0', description: 'Good balance' },
];
```

**Why these models:**
| Model | Price | Features |
|-------|-------|----------|
| `flux` | 0.0002 pollen | Fast, high-quality, text-only |
| `klein-large` | 0.012 pollen | Supports image editing, 9B params |
| `gptimage-large` | 0.000032 pollen | OpenAI's advanced, supports editing |
| `seedream` | 0.03 pollen | ByteDance, good quality |

---

### 2. File: `src/pages/ImageGen.tsx` - Restore Full Prompt Enhancer

**Current (lines 141-159):** Simplified one-line instructions

**Replace with full context-aware version:**
```typescript
const enhancePrompt = async () => {
  if (prompt.length < 3) return;
  setEnhancing(true);
  try {
    const hasReferenceImage = !!uploadedImage;
    
    const systemPrompt = hasReferenceImage
      ? `You are an expert prompt writer for image-to-image AI models (Seedream, FLUX, GPT Image).

CRITICAL: The user has uploaded a REFERENCE IMAGE. Any pronouns like "him", "her", "them", "the person", "this", "it" refer to the SUBJECT IN THE REFERENCE IMAGE.

Rules for image-to-image prompts:
1. PRESERVE references to the original image - use phrases like "the subject from the reference image", "the person in the photo", "maintain the original subject"
2. Start with the subject and what transformation/action should happen
3. Add environment, background, lighting, mood
4. Include style details: photorealistic, cinematic lighting, color palette, lens info (85mm, shallow depth of field)
5. Be specific with colors, textures, lighting (e.g., warm golden hour, soft bokeh)
6. Use complete natural sentences, not keyword lists
7. Keep prompts 30-100 words
8. Optional: add what to avoid (no blurry details, no extra limbs)

Example transformations:
- "make him meet ronaldo" → "The subject from the reference image meets Cristiano Ronaldo on a professional football field, both smiling, stadium lights in background, photorealistic, cinematic lighting, 85mm lens"
- "put her in paris" → "The person from the reference photo stands in front of the Eiffel Tower in Paris, daytime, soft natural lighting, travel photography style, vibrant colors"
- "make it cyberpunk" → "Transform the reference image into cyberpunk style with neon lights, rain-slicked streets, holographic advertisements, moody purple and cyan lighting"

RESPOND WITH ONLY THE ENHANCED PROMPT. No explanations.`
      : `You are an expert prompt writer for text-to-image AI models.

Rules for image generation prompts:
1. Start with the main subject and describe it clearly
2. Add action or pose if relevant
3. Define the environment, background, lighting, mood
4. Include style: photorealistic, cinematic, artistic, etc.
5. Add technical details: lens info, depth of field, color palette
6. Be specific with colors, textures, lighting
7. Use complete natural sentences, not keyword lists
8. Keep prompts 30-100 words

RESPOND WITH ONLY THE ENHANCED PROMPT. No explanations.`;

    const enhanced = await sendNormal(
      `${systemPrompt}

Original prompt: "${prompt}"

Enhanced prompt:`
    );
    
    let cleaned = enhanced
      .replace(/\*\*/g, '')
      .replace(/^["']|["']$/g, '')
      .replace(/^.*?(?:Enhanced prompt|prompt|version|here|output):\s*/im, '')
      .replace(/\{image:[^}]+\}/g, '')
      .trim();
    
    setPrompt(cleaned);
    toast({ 
      title: 'Prompt Enhanced!', 
      description: hasReferenceImage 
        ? 'Optimized for image-to-image editing' 
        : 'Your prompt has been improved' 
    });
  } catch {
    toast({ title: 'Error', description: 'Failed to enhance prompt', variant: 'destructive' });
  } finally {
    setEnhancing(false);
  }
};
```

---

### 3. Update Header Text

Since we're now showing 4 models instead of 5, update the header:

**Line 353:**
```typescript
<p className="text-xs text-muted-foreground">4 Models</p>
```

---

## Summary of Changes

| File | Lines | Change |
|------|-------|--------|
| `src/pages/ImageGen.tsx` | 17-23 | Remove `seedream-pro`, reduce to 4 models, add `flux` |
| `src/pages/ImageGen.tsx` | 141-159 | Restore full prompt enhancer with image-to-image awareness |
| `src/pages/ImageGen.tsx` | 353 | Update "5 Models" → "4 Models" |

---

## Model Comparison

| Removed | Added | Reason |
|---------|-------|--------|
| `seedream-pro` (0.04 pollen) | `flux` (0.0002 pollen) | 200x cheaper, fast, high quality |
| `klein` (kept for variety) | - | Klein 4B removed to keep 4 models |

---

## Result

- **No paid models** - All 4 models are free/very cheap
- **Better image-to-image prompts** - Full context-aware instructions for reference images
- **Pronoun preservation** - "make him meet ronaldo" properly keeps reference to uploaded subject

