
# Website Generator Enhancement Plan

## Issues Identified

### Issue 1: Multi-Select Mode Failures
When selecting multiple complex modes (Interactive + 3D + Animated), the AI returns incomplete code:
- The API reports "Success" but the response contains no/minimal content
- The client-side check (`code.length < 100`) triggers "Generation incomplete" error
- Root cause: Combined system prompts become too complex for the model to handle well

### Issue 2: No Prompt Enhancement Feature
User wants an "Enhance Text" button that transforms simple prompts into detailed, optimized ones.

---

## Solution Design

### Fix 1: Improve Multi-Mode Handling

**Problem Analysis:**
When combining 3+ modes, the system prompt becomes ~600+ words with conflicting requirements (Three.js canvas vs Alpine.js DOM, GSAP timelines vs Kaboom game loop).

**Solution Options:**

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A | Limit to 2 modes max | Simple, reliable | Restricts flexibility |
| B | Priority-based mode fusion | Smarter combinations | Complex logic |
| C | Increase max_tokens + better prompts | More complete output | May still fail |

**Recommended: Option A + C Combined**
- Allow 2 modes maximum for reliable generation
- Improve max_tokens from 8192 to 16384
- Add clearer priority instructions in multi-mode prompts
- Show warning when selecting potentially conflicting modes

**Changes to `src/pages/WebGen.tsx`:**
- Limit `selectedModes` to maximum 2 selections
- Show warning toast when attempting to select 3rd mode
- Add conflict detection (e.g., Game + 3D = complex, warn user)

**Changes to `supabase/functions/web-gen/index.ts`:**
- Increase `max_tokens` to 16384
- Add explicit priority ordering in multi-mode prompts
- Improve integration guidance for mode combinations

---

### Fix 2: Add "Enhance Text" Button with Claude-Optimized Prompt Engineering

**Location:** Add button next to the prompt input textarea

**How It Works:**
1. User types simple prompt: "make me a game webapp"
2. Clicks "Enhance" sparkle button
3. System calls existing `/grammify` edge function with `enhancement: 'prompt-engineering'`
4. Returns structured, detailed prompt optimized for website generation

**Enhanced Prompt Structure (following Claude best practices):**
```text
Input: "make me a game webapp"

Output: "Create a 2D browser game web application with the following specifications:

GAME MECHANICS:
- Player character with keyboard controls (WASD or arrow keys)
- Score tracking and display
- Multiple levels or increasing difficulty
- Game over and restart functionality

USER INTERFACE:
- Start screen with play button and instructions
- In-game HUD showing score, lives, and level
- Pause menu with resume and restart options
- Game over screen with final score and replay button

VISUAL DESIGN:
- Pixel art or modern flat design aesthetic
- Smooth animations for player movement and interactions
- Particle effects for actions (jumping, collecting items)
- Responsive layout that works on desktop and mobile

AUDIO (optional placeholders):
- Background music loop
- Sound effects for key actions"
```

**UI Changes to `src/pages/WebGen.tsx`:**
```text
┌─────────────────────────────────────────────────────────┐
│ [                 Enter your prompt...                ] │
│                                              [✨ Enhance]│
└─────────────────────────────────────────────────────────┘
```

**Implementation Details:**
- Add loading state while enhancing
- Call `/grammify` with `enhancement: 'prompt-engineering'`
- Replace textarea content with enhanced prompt
- User can edit the enhanced prompt before proceeding

---

## Technical Implementation

### File: `src/pages/WebGen.tsx`

1. **Add state for enhancement:**
```typescript
const [isEnhancing, setIsEnhancing] = useState(false);
```

2. **Add enhance function:**
```typescript
const enhancePrompt = async () => {
  if (!inputValue.trim() || inputValue.length < 3) return;
  
  setIsEnhancing(true);
  try {
    const response = await supabase.functions.invoke('grammify', {
      body: {
        text: inputValue,
        enhancement: 'prompt-engineering',
        promptMode: 'longer',
        personalization: 'neutral',
        replyMode: 'think'
      }
    });
    
    if (response.data?.enhancedText) {
      setInputValue(response.data.enhancedText);
      toast({ title: "Prompt enhanced!", description: "Your prompt has been optimized" });
    }
  } catch (error) {
    toast({ title: "Enhancement failed", variant: "destructive" });
  } finally {
    setIsEnhancing(false);
  }
};
```

3. **Add mode selection limit:**
```typescript
const toggleMode = (modeId: string) => {
  setSelectedModes(prev => {
    if (modeId === 'standard') {
      return prev.includes('standard') ? [] : ['standard'];
    }
    
    const withoutStandard = prev.filter(m => m !== 'standard');
    
    if (withoutStandard.includes(modeId)) {
      return withoutStandard.filter(m => m !== modeId);
    }
    
    // Limit to 2 modes maximum
    if (withoutStandard.length >= 2) {
      toast({
        title: "Maximum 2 modes",
        description: "For best results, select up to 2 website modes",
        variant: "destructive"
      });
      return withoutStandard;
    }
    
    return [...withoutStandard, modeId];
  });
};
```

4. **Update input area UI to include enhance button:**
- Add sparkle button next to input
- Show loading spinner while enhancing
- Button disabled during generation or if prompt is empty

### File: `supabase/functions/web-gen/index.ts`

1. **Increase max_tokens:**
```typescript
max_tokens: 16384  // Up from 8192
```

2. **Add priority ordering for multi-mode:**
```typescript
if (modes.includes('game') && modes.includes('threejs')) {
  prompt += `\nPRIORITY: Focus primarily on the GAME mechanics. Use Three.js ONLY for background visuals or decorative 3D elements.\n`;
}
```

---

## UI Preview

### Enhanced Prompt Input:
```text
┌──────────────────────────────────────────────────────────────────┐
│ Describe your dream website                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  make me a game webapp                                           │
│                                                                  │
│                                                        [✨]      │
│                                                     Enhance      │
├──────────────────────────────────────────────────────────────────┤
│                    [Send →]                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Mode Selection with Limit:
```text
Website Mode                                   [Multi-select: Max 2]
┌─────────────┐ ┌─────────────────┐ ┌────────────┐
│ Standard    │ │ Interactive ⭐  │ │ Game Mode  │
│ ○           │ │ ● SELECTED      │ │ ● SELECTED │
└─────────────┘ └─────────────────┘ └────────────┘
┌─────────────┐ ┌─────────────────┐
│ 3D Exp.     │ │ Animated        │  <- Clicking these shows toast
│ ○           │ │ ○               │     "Maximum 2 modes"
└─────────────┘ └─────────────────┘

✨ Combining: Interactive + Game Mode
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | Add enhance button, limit modes to 2, add `enhancePrompt()` function, update UI |
| `supabase/functions/web-gen/index.ts` | Increase `max_tokens` to 16384, add priority ordering for mode combinations |

---

## Expected Outcomes

After these changes:
- Multi-select works reliably with up to 2 modes
- Users get clear feedback when trying to select 3+ modes
- "Enhance" button transforms simple prompts into detailed, structured ones
- Better generation success rate with increased token limit
- More consistent output quality with priority-based mode fusion
