
# Web Generator UI Enhancement Plan

## Overview
Two issues to address:
1. **Enhance Text button not working** - Currently calls `grammify` which is failing with API errors
2. **Background looks empty** - Current subtle particle effects don't match the vibrant reference designs

---

## Issue 1: Fix Enhance Text Feature

### Root Cause
The WebGen's `enhancePrompt()` function calls the `grammify` edge function, which is experiencing API key authentication failures. Meanwhile, the ImageGen uses a different, working approach by directly calling `pollinations-chat`.

### Solution
Replicate the ImageGen's proven enhance pattern that directly calls `pollinations-chat` with a website-specific system prompt.

### Changes to `src/pages/WebGen.tsx`

**Replace the current `enhancePrompt()` function with:**
- Direct call to `pollinations-chat` edge function (like ImageGen does)
- Custom system prompt optimized for website generation
- Proper response cleaning to remove AI filler text
- Better error handling with specific toast messages

**New system prompt structure:**
```text
You are an expert prompt writer for AI website generators.

Rules for website prompts:
1. Start with the website type and purpose
2. Define key sections and features
3. Specify visual style, colors, and mood
4. Include interactivity requirements
5. Add specific UI elements to include
6. Keep prompts 50-150 words
7. Use structured, clear language

Example:
"make me a game" → "Create a 2D browser-based arcade game with the following:

GAME FEATURES:
- Player character with keyboard controls (arrow keys)
- Score system displayed in top corner
- Multiple levels with increasing difficulty
- Game over and restart functionality

VISUAL STYLE:
- Retro pixel art aesthetic
- Neon color palette (cyan, pink, purple)
- Particle effects on actions
- Smooth animations

Include start screen, in-game HUD, and game over screen."
```

---

## Issue 2: Enhanced Background Design

### Reference Analysis
The uploaded images show:
- **brain.fm**: Dark gradient with magenta/pink/purple glow on right side, very visible
- **Lovable**: Subtle matrix-like characters, clean dark with focused input area
- **Huly**: Dramatic vertical blue light beam from top, product mockup integration

### Solution: Create a New WebGenBackground Component
Create a specialized background for the /web page with more dramatic visual effects inspired by the references.

### New Component: `src/components/WebGenBackground.tsx`

**Key features:**
1. **Central Light Beam** - Vertical gradient beam (like Huly) emanating from top-center
2. **Larger, More Visible Gradient Orbs** - Higher opacity (15-30% vs current 5-15%)
3. **Asymmetric Glow Zones** - Pink/magenta concentrated on one side (like brain.fm)
4. **Animated Mesh Gradient** - Slow-moving gradient layers for depth
5. **Subtle Grid Pattern** - Optional matrix-like effect (like Lovable)

**Visual structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│                    ╲ LIGHT BEAM ╱                           │
│                     ╲         ╱                             │
│   ████████████       ╲       ╱                              │
│   █ PINK ORB █        ╲     ╱       ████████████            │
│   ████████████         ╲   ╱        █ PURPLE ORB█           │
│                         ╲ ╱         ████████████            │
│                          ╳                                   │
│                         ╱ ╲                                  │
│                        ╱   ╲                                 │
│   ─────────────────────────────────────────────────         │
│   █████████████ GRADIENT MESH LAYER █████████████           │
│   ─────────────────────────────────────────────────         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specific Visual Elements

**1. Vertical Light Beam (Top Center)**
- Narrow at top, spreading downward
- Blue/cyan gradient or pink/purple to match theme
- High opacity at center (40-60%), fading to edges
- Subtle animation (pulse or slight movement)

**2. Large Gradient Orbs**
- 2-3 large orbs positioned asymmetrically
- Higher opacity: 20-35% (current is 5-15%)
- Larger size: 500-800px diameter
- Positioned at specific locations, not random
- Slower, more subtle animation

**3. Gradient Overlays**
- Stronger color presence (10-15% opacity vs current 5-8%)
- Asymmetric placement for visual interest
- Pink/magenta emphasis on left, purple on right (or vice versa)

**4. Optional Enhancements**
- Subtle grid/matrix pattern overlay (very low opacity)
- Animated "stars" or small particles
- Vignette effect (darker edges)

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | Replace `enhancePrompt()` to use `pollinations-chat` directly, swap `PremiumBackground` with `WebGenBackground` |
| `src/components/WebGenBackground.tsx` | New component with dramatic visual effects matching reference designs |

---

## Technical Implementation Details

### WebGenBackground Component Structure

```tsx
// Key elements to include:
const WebGenBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Central vertical light beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-full">
        {/* Gradient beam with glow */}
      </div>
      
      {/* Large positioned gradient orbs (not random) */}
      <div className="absolute -left-[200px] top-[20%] w-[800px] h-[800px]">
        {/* Pink/magenta orb */}
      </div>
      <div className="absolute -right-[200px] bottom-[20%] w-[600px] h-[600px]">
        {/* Purple orb */}
      </div>
      
      {/* Gradient overlay layers */}
      {/* Grid pattern (optional) */}
      {/* Noise texture */}
    </div>
  );
};
```

### Enhanced enhancePrompt Function

```tsx
const enhancePrompt = async () => {
  if (!inputValue.trim() || inputValue.length < 3) return;
  
  setIsEnhancing(true);
  try {
    const systemPrompt = `You are an expert prompt writer for AI website generators.
    
Rules:
1. Start with website type and purpose
2. Define key sections and features
3. Specify visual style and mood
4. Include interactivity requirements
5. Keep prompts 50-150 words
6. Use structured, clear sections

Return ONLY the enhanced prompt. No explanations.`;

    const { data, error } = await supabase.functions.invoke('pollinations-chat', {
      body: {
        prompt: `${systemPrompt}\n\nOriginal: "${inputValue}"\n\nEnhanced:`,
        model: 'gemini-3-flash',
        seed: Math.floor(Math.random() * 1000000),
        systemPrompt: 'Enhance website prompts. Return only the enhanced text.'
      }
    });

    if (error) throw error;
    
    // Clean response (remove AI filler)
    let cleaned = (data?.text || '')
      .replace(/^["']|["']$/g, '')
      .replace(/^.*?(?:Enhanced|prompt|here):\s*/im, '')
      .replace(/^(Alright|Okay|Sure|Here)[,!.]?\s*/i, '')
      .trim();
    
    if (cleaned.length > 10) {
      setInputValue(cleaned);
      toast({ title: 'Prompt Enhanced!' });
    }
  } catch (err) {
    toast({ title: 'Error', description: 'Failed to enhance', variant: 'destructive' });
  } finally {
    setIsEnhancing(false);
  }
};
```

---

## Expected Visual Outcome

After these changes, the /web page will have:
- A dramatic, premium feel matching modern AI tool aesthetics
- Visible gradient effects that add visual interest without overwhelming content
- A working "Enhance" button that transforms simple prompts into detailed specifications
- Better alignment with the brain.fm, Lovable, and Huly reference designs
