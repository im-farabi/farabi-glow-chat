

# Improve Image-to-Image Prompt Enhancer

## Problem

When a user uploads a reference image and types "make him meet ronaldo", the current prompt enhancer doesn't understand:
- **"him"** refers to the subject in the uploaded reference image
- This is an **image-to-image editing** task, not text-to-image generation
- The prompt should preserve references to the original image

### Current Behavior
```
User uploads: Photo of a person
User types: "make him meet ronaldo"
Enhanced: "A stunning photorealistic portrait of a man meeting..." ❌
```
The AI treats "him" as if it needs to be described, losing the connection to the reference image.

### Expected Behavior
```
User uploads: Photo of a person  
User types: "make him meet ronaldo"
Enhanced: "The subject from the reference image meets Cristiano Ronaldo on a football field, cinematic lighting, photorealistic, 85mm lens, shallow depth of field" ✅
```

---

## Solution

Update the `enhancePrompt` function to:
1. Detect if a reference image is uploaded
2. Use specialized image-to-image prompt engineering instructions
3. Preserve pronouns like "him", "her", "this", "the person" as references to the original image

---

## Changes Required

### File: `src/pages/ImageGen.tsx`

**Update the `enhancePrompt` function:**

```typescript
const enhancePrompt = async () => {
  if (prompt.length < 3) {
    toast({ title: 'Error', description: 'Prompt must be at least 3 characters', variant: 'destructive' });
    return;
  }

  setEnhancing(true);
  try {
    // Use different instructions based on whether there's a reference image
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

## Key Improvements

| Before | After |
|--------|-------|
| Generic prompt enhancement | Context-aware: knows if reference image exists |
| Doesn't understand pronouns | Preserves "him", "her", "the person" as references to uploaded image |
| Overwrites the subject | Keeps connection to reference image subject |
| No image-to-image awareness | Specialized instructions for image editing |

---

## Example Transformations

### With Reference Image Uploaded:

| User Input | Enhanced Output |
|------------|-----------------|
| "make him meet ronaldo" | "The subject from the reference image meets Cristiano Ronaldo on a professional football field, both posing together, stadium atmosphere, photorealistic, cinematic lighting, 85mm lens, shallow depth of field" |
| "put her in japan" | "The person from the reference photo stands in a traditional Japanese street in Kyoto, cherry blossoms falling, soft natural daylight, travel photography style" |
| "make it dark and moody" | "Transform the reference image with dramatic dark and moody atmosphere, high contrast shadows, desaturated colors with deep blacks, cinematic noir lighting" |

### Without Reference Image (text-to-image):

| User Input | Enhanced Output |
|------------|-----------------|
| "a cat" | "A fluffy orange tabby cat sitting on a sunlit windowsill, soft natural lighting, shallow depth of field, photorealistic, warm cozy atmosphere" |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ImageGen.tsx` | Update `enhancePrompt` function with context-aware image-to-image instructions |

