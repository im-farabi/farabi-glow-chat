

# Illustrated Story Generator with Dual-Model Image Selection

## Core Problem
Comic-style random prompts produce logically inconsistent images (wrong character positions, mismatched actions). Switching to a **story-driven** approach where prompts describe scenes narratively will fix this.

## Key Changes

### 1. Story-Driven Prompt Rewrite
Instead of "comic panel" prompts, the AI will generate **illustrated story scene** prompts. Each prompt will describe the scene as a continuous narrative moment — "the boy is lying on the grass looking up at an owl perched on a bench nearby" — not fragmented comic actions. The system prompt will enforce:
- **Spatial logic**: Who is where, what position, what they see from that position
- **Cause-and-effect**: If someone falls, THEY show pain, not someone else
- **Scene continuity**: Each prompt references what happened in the previous scene

### 2. Dual-Model Image Generation (2 images per panel)
Each panel generates **2 images simultaneously** using a selected "Duo":
- **DUO #1 (Recommended)**: `flux-2-dev` + `imagen-4` — high quality, good redundancy
- **DUO #2**: `grok-imagine` + `zimage` — alternative pair

User selects their preferred Duo before generation starts (new step between Genre and Generate).

### 3. Image Selection UI
In the book reader, each panel shows **2 images side-by-side** with model names. User clicks their preferred image to "keep" it. The unkept image fades out. This serves dual purpose:
- User gets the better image
- If one model fails, the other still works (built-in fallback)

### 4. Updated ComicPanel Interface
```typescript
interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;
  caption: string;
  imageA: { url: string | null; model: string; status: 'waiting'|'generating'|'done'|'error'; error?: string };
  imageB: { url: string | null; model: string; status: 'waiting'|'generating'|'done'|'error'; error?: string };
  selectedImage: 'A' | 'B' | null;
}
```

### 5. New Phase Flow
```text
idle → style → genre → duo-select (NEW) → planning → generating → complete
```

### 6. Edge Function Update (`image-gen-multi`)
Add `grok-imagine` and `imagen-4` to the `MODEL_FALLBACKS` map. Increase timeout to 30s for slower models like imagen-4.

### 7. Planning Prompt Overhaul — Story Mode
Key changes to the system prompt:
- Replace "comic panel" language with "illustrated story page"
- Add **SPATIAL LOGIC RULES**: "Describe exactly where each character is. If someone is lying down, describe what they see FROM that position. If someone falls, THAT person feels pain."
- Add **CAUSE-EFFECT RULES**: "Every action has a logical reaction. If a cat falls, the cat is hurt. If a boy catches something, describe the boy's arms and hands."
- Character sheet stays but prompts become full narrative scene descriptions
- Each prompt must start with "Scene continuation:" referencing prior scene context

## Files Modified

| File | Change |
|------|--------|
| `src/pages/ComicGen.tsx` | New duo-select phase, dual-image panel UI, story-driven prompts, image selection clicks |
| `supabase/functions/image-gen-multi/index.ts` | Add `grok-imagine` and `imagen-4` to fallbacks, increase timeout |

## UI for Duo Selection (new phase)
Two cards side by side:
- Card 1: "DUO #1 — FLUX + IMAGEN" with ⭐ Recommended badge, subtitle "Best quality, great redundancy"
- Card 2: "DUO #2 — GROK + ZIMAGE", subtitle "Fast alternative pair"

## UI for Image Selection (during generating/complete)
```text
┌──────────────────────────────────────────┐
│         "WHAT IS THAT?!" (dialogue)      │
├───────────────────┬──────────────────────┤
│   [Image A]       │   [Image B]          │
│   flux-2-dev      │   imagen-4           │
│   [Click to keep] │   [Click to keep]    │
├───────────────────┴──────────────────────┤
│  He saw something in the sky. (caption)  │
└──────────────────────────────────────────┘
```

After clicking, the selected image goes full-width and the other disappears with a fade animation.

