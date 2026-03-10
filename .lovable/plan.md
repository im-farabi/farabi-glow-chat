

# Comic Generator Overhaul

## Summary
Complete redesign of `/comic` with a multi-step setup flow, book-style reader, simplified language, and proper character management in prompts.

## Changes

### 1. New Multi-Step Flow
```text
Step 1: Story Input (textarea + "Surprise Me" button at bottom)
Step 2: Art Style Selection (3 cards with images)
  - Pixelated (pixel art reference)
  - Colorless (black & white comic)  
  - Modern (recommended badge)
Step 3: Story Type Selection (tag buttons)
  - Romantic, Good Humor, Funny, Dark, Suspicious, Heist, Unexpected, Adventure, Sci-Fi, Horror
Step 4: "GENERATING STORY..." loading screen
Step 5: Book-style reader with one panel per page, left/right navigation
```

### 2. Art Style Images
Copy the 3 uploaded reference images to `src/assets/` for the style picker cards. The pixelated image maps to pixel art style, the B&W comic to colorless, and the colorful comic to modern.

### 3. AI Model Changes
- Planning model: `gemini-fast` (was `gemini-search`)
- Image model: `zimage` primary, `flux-2-dev` fallback (already set, keep as-is)

### 4. Prompt Overhaul — Simple Language + Dual Text
Each panel now has:
- `dialogue` — character speech/reaction at top of image (e.g., "WHAT'S THAT?! OMG!")
- `caption` — narrator text below image (simple, kid-friendly)

Prompt instructions will enforce:
- Simple English a 10-year-old can understand
- CHARACTER SHEET: define all characters once at planning stage with exact appearance (hair, skin, clothes, height, build) and reference them consistently in every prompt
- Art style prefix changes based on user's style choice (Pixelated/Colorless/Modern)
- Story type deeply influences the narrative tone

### 5. Book-Style Reader (Generating/Complete phases)
- One panel per page, full-screen centered
- Dialogue text above image, caption below
- Left/Right arrow buttons + keyboard arrow key support
- "GENERATING COMICS" banner stays visible until ALL panels complete
- Progress indicator (e.g., "Panel 5 of 20")
- No grid — prevents spoilers

### 6. "Surprise Me" Button
Replaces example stories. Picks a random creative story idea and fills the textarea.

## Files Modified

| File | Action |
|------|--------|
| `src/pages/ComicGen.tsx` | Full rewrite — multi-step setup, book reader, new prompt system |
| `src/assets/comic-style-pixel.png` | Copy from upload (pixelated reference) |
| `src/assets/comic-style-colorless.png` | Copy from upload (colorless reference) |
| `src/assets/comic-style-modern.png` | Copy from upload (modern reference) |

### 7. ComicPanel Interface Update
```typescript
interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;  // character speech — shown above image
  caption: string;   // narrator text — shown below image
  imageUrl: string | null;
  status: 'waiting' | 'generating' | 'done' | 'error';
  errorMsg?: string;
}

type Phase = 'idle' | 'style' | 'genre' | 'planning' | 'generating' | 'complete';
```

### 8. Planning Prompt Key Changes
- Instruct AI to create a CHARACTER SHEET first (name, hair color, skin tone, clothing, height, unique features) and reference it in every panel prompt
- Art style prefix based on selection: "Pixel art style, 8-bit retro..." / "Black and white ink illustration..." / "Modern comic book, vibrant colors..."
- Story type deeply shapes tone: romantic = heartfelt moments, unexpected = plot twists, heist = tension
- Language: "Write like you're telling a story to a 10 year old. Use simple words. Short sentences."
- Each panel prompt includes dialogue text rendered in the image and narrator caption separately

