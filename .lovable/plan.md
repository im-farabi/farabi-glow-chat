

# Progress Bar for Website Generation

## Overview
Add a progress bar that estimates completion percentage based on expected generation times for each model. If generation takes longer than estimated, it sticks at 99% until complete.

## Estimated Generation Times (Based on Token Speeds)

| Model | Tokens/sec | Expected Time (avg website) |
|-------|------------|----------------------------|
| GPT 5.2 | ~100 | **60 seconds** |
| Claude | ~60 | **90 seconds** |
| DeepSeek | ~80 | **75 seconds** |

These are conservative estimates for typical 6,000-8,000 token websites. The system will use these as the "100%" target.

## Implementation

### 1. Add Model Timing Constants

```typescript
// Expected generation times in milliseconds per model (conservative estimates)
const MODEL_EXPECTED_TIMES: Record<ModelType, number> = {
  gpt: 60000,      // 60 seconds
  claude: 90000,   // 90 seconds  
  deepseek: 75000  // 75 seconds
};
```

### 2. Add Progress State

New states needed:
- `progressPercentage: number` - Current progress (0-99)
- `multiModelProgress: Record<ModelType, number>` - Per-model progress in multi-model mode

### 3. Progress Calculation Effect

A `useEffect` that updates every 500ms during generation:

```typescript
useEffect(() => {
  if (!loading) {
    return;
  }
  
  const interval = setInterval(() => {
    const elapsed = Date.now() - generationStartTime;
    
    if (isMultiModelStreaming) {
      // Update each model's progress independently
      const newProgress: Record<string, number> = {};
      (['gpt', 'claude', 'deepseek'] as const).forEach(model => {
        const expected = MODEL_EXPECTED_TIMES[model];
        const progress = Math.min(99, Math.floor((elapsed / expected) * 100));
        newProgress[model] = multiModelStreams[model].done ? 100 : progress;
      });
      setMultiModelProgress(newProgress);
    } else {
      // Single model progress
      const expected = MODEL_EXPECTED_TIMES[selectedModel];
      const progress = Math.min(99, Math.floor((elapsed / expected) * 100));
      setProgressPercentage(progress);
    }
  }, 500);
  
  return () => clearInterval(interval);
}, [loading, generationStartTime, selectedModel, isMultiModelStreaming, multiModelStreams]);
```

### 4. UI Updates

#### Single Model (lines ~1516-1567)
Add progress bar below "Working on it..." spinner:

```tsx
{loading && (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Working on it... {progressPercentage}%</span>
    </div>
    <Progress value={progressPercentage} className="h-2" />
    <p className="text-xs text-muted-foreground">
      {progressPercentage < 99 
        ? `Estimated ${Math.ceil((MODEL_EXPECTED_TIMES[selectedModel] - (Date.now() - generationStartTime)) / 1000)}s remaining`
        : "Almost there..."}
    </p>
  </div>
)}
```

#### Multi-Model (lines ~1570-1644)
Add progress bar to each model's panel header:

```tsx
{/* Progress bar under header */}
<div className="px-2 pb-1">
  <Progress 
    value={stream.done ? 100 : (multiModelProgress[modelKey] || 0)} 
    className="h-1"
  />
  <p className="text-[10px] text-muted-foreground mt-1">
    {stream.done ? "Complete" : `${multiModelProgress[modelKey] || 0}%`}
  </p>
</div>
```

## Visual Design

### Single Model View
```text
┌─────────────────────────────────────────────────────────┐
│ Got it! Creating your website...                        │
│                                                         │
│ ⏳ Working on it... 45%                                 │
│ ███████████████████░░░░░░░░░░░░░░░░░░░░░░ 45%           │
│ Estimated 33s remaining                                 │
│                                                         │
│ 📄 Generating code... ▼                                 │
│ [code preview...]                                       │
│                                                         │
│ [👁️ Live Preview]                                       │
└─────────────────────────────────────────────────────────┘
```

### Multi-Model View
```text
┌─────────────────┬─────────────────┬─────────────────────┐
│ 🤖 GPT 5.2      │ 🌸 Claude       │ 🐋 DeepSeek        │
│ ████████░░ 78%  │ █████░░░░ 52%   │ ███████░░ 68%      │
│ ───────────────  │ ───────────────  │ ───────────────    │
│ <!DOCTYPE html> │ <!DOCTYPE html> │ <!DOCTYPE html>    │
│ ...streaming... │ ...streaming... │ ...streaming...    │
│ [Live Preview]  │ [Live Preview]  │ [Live Preview]     │
└─────────────────┴─────────────────┴─────────────────────┘
```

## File Changes

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | 1. Add `MODEL_EXPECTED_TIMES` constant<br>2. Add `progressPercentage` and `multiModelProgress` states<br>3. Add progress calculation `useEffect`<br>4. Add Progress component to single model generating UI<br>5. Add Progress component to each multi-model panel |

## Edge Cases

1. **Generation exceeds estimate**: Progress sticks at 99% until `done` is true
2. **Fast generation**: Progress jumps to 100% immediately when complete
3. **Model error**: Show error state instead of progress
4. **Reset on new generation**: Progress resets to 0 when starting new generation

## Technical Notes

- Progress updates every 500ms to match live preview interval
- Uses `Date.now() - generationStartTime` for elapsed time
- `multiModelStreams[model].done` flag triggers 100% completion
- Conservative time estimates mean most generations complete before reaching 99%
- The Progress component from `@radix-ui/react-progress` is already available

