

# Enhance Video Generator with AI Prompt Enhancement & Percentage Progress

## Overview
Add an "Enhance Prompt" button that uses AI to transform basic prompts into model-optimized video prompts, and replace the text-based loading status with a percentage-based progress bar that simulates realistic video generation progress.

---

## Research Findings: Optimal Prompt Formulas

### Veo 3.1 (Google)
**Formula:** `[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`

Key elements to include:
- **Cinematography**: dolly shot, tracking shot, crane shot, aerial view, POV, close-up, wide shot, shallow depth of field
- **Subject**: Detailed character/object description
- **Action**: What the subject is doing
- **Context**: Environment, background elements
- **Style**: Aesthetic, mood, lighting, film style
- **Audio** (if enabled): Use quotes for dialogue, "SFX:" for effects, describe ambient sounds

**Example transformation:**
- **Basic**: "a cat playing piano"
- **Enhanced**: "Medium shot with shallow depth of field, a fluffy orange tabby cat, pressing piano keys with its paws in a rhythmic motion, inside a dimly lit jazz club with soft spotlight on the piano, warm amber lighting, cinematic film grain, moody atmosphere. SFX: gentle piano notes playing."

### Seedance (ByteDance)
**Formula:** `Subject + Motion + Scene + Shot/Style`

Key elements to include:
- **Subject**: Character with distinctive features
- **Motion**: Specific action with intensity adverbs (quickly, violently, powerfully, wildly)
- **Camera**: surround, aerial, zoom, pan, follow, handheld movements
- **Scene**: Environment details
- Keep prompts simpler and more direct than Veo

**Example transformation:**
- **Basic**: "a runner crossing finish line"
- **Enhanced**: "An athlete in a professional tracksuit. Legs alternate rapidly, arms swing powerfully, sprinting with all his strength on the field. The camera uses a follow-shot perspective. After crossing the finish line, the audience erupts in cheers."

---

## Files to Create

### 1. `supabase/functions/enhance-video-prompt/index.ts`
New edge function that:
- Accepts: `prompt` (string), `model` ('veo' | 'seedance' | 'seedance-pro'), `hasAudio` (boolean), `hasImages` (boolean)
- Uses `openai-fast` model via existing `NEW_POLLINATIONS_APIKEY_1`
- Applies model-specific system prompts with the prompt formulas
- Returns enhanced prompt optimized for the selected model

**System Prompt for Veo:**
```
You are an expert video prompt engineer for Google Veo 3.1. Transform basic prompts into cinematic video descriptions using this formula:

[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]

Include:
- Camera work: dolly, tracking, crane, POV, close-up, wide shot, etc.
- Subject details: appearance, clothing, expression
- Motion: specific actions and movements
- Environment: setting, lighting, atmosphere
- Style: cinematic, film grain, color grading, mood
{If audio enabled: Add dialogue in quotes, SFX: for sounds, ambient descriptions}
{If images provided: Reference "starting from the first frame" or "transitioning between frames"}

Keep response under 200 words. Output ONLY the enhanced prompt, no explanations.
```

**System Prompt for Seedance:**
```
You are an expert video prompt engineer for Seedance AI. Transform basic prompts into dynamic video descriptions using this formula:

Subject + Motion + Scene + Shot/Style

Include:
- Subject with distinctive features
- Motion with intensity adverbs: rapidly, powerfully, wildly, violently
- Camera movements: surround, aerial, zoom, pan, follow, handheld
- Scene environment
- Keep it direct and concise - Seedance works better with simpler prompts
{If image provided: Focus on motion since scene is already defined}

Keep response under 150 words. Output ONLY the enhanced prompt, no explanations.
```

---

## Files to Modify

### 2. `src/pages/VideoGen.tsx`
Major updates:

**A. Add Enhance Prompt Feature:**
- Add `Wand2` icon import from lucide-react
- Add state: `isEnhancing` (boolean)
- Add "Enhance Prompt" button next to/below prompt textarea
- Call new edge function with current prompt and model
- Replace prompt with enhanced version
- Show loading state during enhancement

**B. Replace Text Status with Percentage Progress Bar:**
- Add state: `progress` (number 0-100)
- Add Progress component import
- Implement animated progress logic:
  - Start at 0% when generation begins
  - Use interval that adds variable random increments (faster initially, slower later)
  - Cap at 99% until actual result arrives
  - Jump to 100% when video is received
  - If video arrives early, quickly animate from current to 100%
- Replace `{loadingStatus}` text with `{progress}%` and Progress component

**Progress Animation Algorithm:**
```typescript
// Base: ~60 seconds to reach 99%
// Progress speed varies: sometimes fast jumps (5-10%), sometimes slow (1-2%)
// Never exceeds 99% until complete
// When complete: animate quickly to 100%

useEffect with interval:
- Every 500-1000ms (random), add random increment
- Increments larger at start (5-15%), smaller near end (1-3%)
- Cap at 99%
- Clear on completion or error
```

### 3. `supabase/config.toml`
Add new function registration:
```toml
[functions.enhance-video-prompt]
verify_jwt = false
```

---

## Technical Details

### Progress Animation Logic
```typescript
const [progress, setProgress] = useState(0);
const progressRef = useRef<NodeJS.Timeout | null>(null);
const generationComplete = useRef(false);

const startProgress = () => {
  setProgress(0);
  generationComplete.current = false;
  
  const tick = () => {
    if (generationComplete.current) return;
    
    setProgress(prev => {
      if (prev >= 99) return 99; // Cap at 99%
      
      // Variable increment: larger early, smaller late
      const remaining = 99 - prev;
      const baseIncrement = Math.random() * (remaining > 50 ? 8 : remaining > 20 ? 4 : 2);
      const increment = Math.max(0.5, baseIncrement);
      
      return Math.min(99, prev + increment);
    });
    
    // Random interval between 800ms and 2000ms
    const nextDelay = 800 + Math.random() * 1200;
    progressRef.current = setTimeout(tick, nextDelay);
  };
  
  progressRef.current = setTimeout(tick, 500);
};

const completeProgress = () => {
  generationComplete.current = true;
  if (progressRef.current) clearTimeout(progressRef.current);
  
  // Animate to 100% quickly
  const animateTo100 = () => {
    setProgress(prev => {
      if (prev >= 100) return 100;
      return Math.min(100, prev + 5);
    });
    if (progress < 100) requestAnimationFrame(animateTo100);
  };
  animateTo100();
};
```

### Enhance Prompt Button UI
```tsx
<div className="flex gap-2 mt-2">
  <Button
    variant="outline"
    size="sm"
    onClick={handleEnhancePrompt}
    disabled={isEnhancing || !prompt.trim()}
    className="gap-2"
  >
    {isEnhancing ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Wand2 className="h-4 w-4" />
    )}
    Enhance Prompt
  </Button>
</div>
```

### Progress Bar UI
```tsx
<Button disabled className="w-full h-14">
  <div className="flex flex-col items-center w-full">
    <div className="flex items-center gap-2 mb-1">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Generating... {Math.floor(progress)}%</span>
    </div>
    <Progress value={progress} className="w-full h-2" />
  </div>
</Button>
```

---

## Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/enhance-video-prompt/index.ts` | Create | AI prompt enhancement with model-specific formulas |
| `supabase/config.toml` | Modify | Register new edge function |
| `src/pages/VideoGen.tsx` | Modify | Add Enhance button + percentage progress bar |

