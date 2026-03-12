

# Comic Generator Upgrade — AI Picks, Audiobook, Progress Bars, Nav Fix

## Changes

### 1. Remove Duo Selection → Single Model (AI Picks)
Remove the entire `duo-select` phase and `DUOS` constant. Instead, AI (mistral model) picks the best single model per story based on genre/style. New phase flow:
```
idle → style → genre → planning → generating → complete
```

**"LET AI PICK" buttons** added to:
- **Genre phase**: A button that calls mistral to read the story and pick the best genre combo
- **Genre phase**: Replaces the "Next: Choose Image Engine" with auto-proceeding after AI picks

**AI Model Selection**: During planning phase, a quick mistral call analyzes story + genres + style, then picks ONE model from `[zimage, imagen-4, grok-imagine, flux-2-dev]` with reasoning based on the pros/cons data provided. The panel interface simplifies back to single image:

```typescript
interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;
  caption: string;
  imageUrl: string | null;
  model: string;
  status: 'waiting' | 'generating' | 'done' | 'error';
  errorMsg?: string;
}
```

### 2. Progress Bars
- **Planning phase**: Animated progress bar that fills to 99% over ~23 seconds, jumps to 100% on completion. Uses a `useEffect` interval that increments smoothly.
- **Generating phase**: Real progress bar based on `(doneImages / totalImages) * 100`.

### 3. Dino Game During Image Generation Too
Show DinoGame component during the `generating` phase as well (below the progress bar in the generating banner), not just planning.

### 4. Audiobook Feature
- **"LISTEN AUDIOBOOK" button** at top of reader (🔊 icon)
- Uses Pollinations TTS via `pollinations-tts` edge function (already exists) — calls `gen.pollinations.ai/audio/{text}` GET endpoint
- When activated: reads each panel's caption + dialogue aloud, auto-advances to next page when audio finishes
- Uses voice `nova` (clear storytelling voice)
- Shows a small player bar at top with pause/stop controls
- Auto-turns pages — no need for user to click arrows

### 5. Navigation Arrows Beside Image (Not Below)
Move `<` and `>` buttons to the **sides of the image** instead of below. Layout becomes:
```
[<]  [  dialogue  ]  [>]
[<]  [   image    ]  [>]
[<]  [  caption   ]  [>]
```
Using a flex row: `← button | story content | → button`, with buttons vertically centered.

### 6. Edge Function Update — TTS
The existing `pollinations-tts` function uses `/text/` endpoint. Update it to use the new `/audio/` endpoint as documented by the user:
```
GET https://gen.pollinations.ai/audio/{text}?voice=nova&key={apiKey}
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/ComicGen.tsx` | Full rewrite: remove duo, add AI pick (mistral calls), single-image panels, side nav arrows, progress bars, audiobook player, dino game during generating |
| `supabase/functions/pollinations-tts/index.ts` | Update endpoint from `/text/` to `/audio/` |

## AI Pick Flow Detail
1. User clicks "LET AI PICK" on genre screen → quick mistral call → returns recommended genres → auto-selects them
2. User clicks "Generate Story" → planning starts → during planning, a parallel mistral call picks the best image model based on story content, genres, and art style → that model is used for all images
3. Both mistral calls use `pollinations-chat` edge function with `model: 'mistral'`, low `max_tokens` (200), `temperature: 0.3` for fast deterministic picks

