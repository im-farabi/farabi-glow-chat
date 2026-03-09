

# /comic — AI Comic Generator

## Overview

A page where the user describes a story idea, AI decides how many panels are needed (15-50), generates detailed prompts for each panel, then generates images one by one using Imagen 4 via the existing `image-gen-multi` edge function. Each prompt includes full scene context since Imagen 4 has no conversation history.

## Flow

```text
┌─────────────────────────────────┐
│  Step 1: Story Input            │
│  "What story do you want?"      │
│  [Textarea] [Generate →]        │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Step 2: AI Planning            │
│  gemini-search decides:         │
│  - Number of panels (15-50)     │
│  - Prompt for each panel        │
│  Shows: "Planning 23 panels..." │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Step 3: Sequential Generation  │
│  Generate images ONE BY ONE     │
│  Panel 1/23 ✅                  │
│  Panel 2/23 ✅                  │
│  Panel 3/23 ⏳ Generating...    │
│  Panel 4/23 ⬜ Waiting          │
│  ...                            │
│  [Comic grid builds live]       │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Step 4: View Comic             │
│  Full comic grid with all       │
│  panels, download option        │
└─────────────────────────────────┘
```

## Technical Design

### AI Planning (Step 2)
Uses `sendNormal` (gemini-search via `pollinations-chat`) to analyze the story and return JSON:

```json
{
  "title": "The Great Bank Heist",
  "panelCount": 20,
  "panels": [
    {
      "id": 1,
      "prompt": "Comic book style illustration. A dimly lit office at night. Three masked robbers in black suits huddle around a table studying a blueprint of First National Bank. The leader, a tall man with a scar, points at the vault location. Noir lighting, dramatic shadows, bold outlines, speech bubble style.",
      "caption": "The plan begins..."
    },
    ...
  ]
}
```

Key: Each prompt is **self-contained** — it describes the full scene including character appearances, setting, art style, and story context since Imagen 4 has no memory.

### Image Generation (Step 3)
Uses existing `image-gen-multi` edge function with `model: 'imagen4'` and the existing `NEW_POLLINATIONS_APIKEY_1`. Images generated sequentially (one at a time) to avoid rate limits and ensure order. Each panel appears in the grid as it completes.

### Prompt Strategy
Since Imagen 4 has no conversation history, every prompt must include:
- Consistent art style prefix ("Comic book style, bold outlines, vibrant colors")
- Character descriptions repeated (e.g., "a tall man with a scar and black mask")
- Scene setting from scratch each time
- Story context ("after escaping the vault...")

## Files

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/ComicGen.tsx` | Create | Main comic generator page |
| `src/App.tsx` | Update | Add `/comic` route |

No new edge functions needed — reuses `pollinations-chat` (for planning) and `image-gen-multi` (for imagen4 images).

## UI Design

Uses PremiumBackground (existing). Comic-book themed with:
- Story input with example prompts
- Progress tracker showing each panel's status
- Comic grid layout (2-3 columns) that fills in live
- Each panel shows image + caption below
- Download all button at the end

## Component Structure (ComicGen.tsx)

States: `idle` → `planning` → `generating` → `complete`

```typescript
interface ComicPanel {
  id: number;
  prompt: string;
  caption: string;
  imageUrl: string | null;
  status: 'waiting' | 'generating' | 'done' | 'error';
}

interface ComicState {
  title: string;
  panels: ComicPanel[];
}
```

Generation loop:
```typescript
for (const panel of panels) {
  // Update status to 'generating'
  // Call image-gen-multi with model='imagen4'
  // Update panel with imageUrl, status='done'
  // Small delay between calls to avoid rate limits
}
```

## Implementation Order

1. Create `src/pages/ComicGen.tsx` with all UI states and generation logic
2. Add `/comic` route to `src/App.tsx`

