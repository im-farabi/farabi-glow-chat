
# Multi-Model Streaming + Live Preview During Generation

## Feature 1: Multi-Model Mode with Live Streaming

### Current Behavior
- Multi-model waits in background, shows spinner, then displays results
- No visibility into what's happening

### New Behavior
- Shows "Got it" message with 3 streaming code panels side by side
- Each model streams its code independently in real-time
- Users see all 3 models working simultaneously
- When all complete, comparison modal appears with previews

### Implementation

**Frontend Changes (WebGen.tsx)**

1. **New state for multi-model streaming:**
```typescript
interface MultiModelStreamState {
  gpt: { code: string; loading: boolean; error?: string };
  claude: { code: string; loading: boolean; error?: string };
  deepseek: { code: string; loading: boolean; error?: string };
}
const [multiModelStreams, setMultiModelStreams] = useState<MultiModelStreamState>({
  gpt: { code: '', loading: false },
  claude: { code: '', loading: false },
  deepseek: { code: '', loading: false }
});
```

2. **New `generateMultiModelStreaming` function:**
- Calls `/web-gen` 3 times in parallel with `stream: true`
- Each call updates its own stream state independently
- Uses `Promise.allSettled` to wait for all 3
- Each model gets its own `ReadableStream` reader

3. **Update generating UI for multi-model:**
- Instead of single code box, show 3 side-by-side panels
- Each panel shows model icon + name + streaming code
- Collapsible by default, can expand each one

**Backend Changes (web-gen/index.ts)**

- No changes needed - single model streaming already works
- Multi-model just calls the same endpoint 3 times with different `model` parameter

---

## Feature 2: Live Preview Button During Generation

### Concept
While code is streaming, show a "Live Preview" button that:
1. Creates a blob URL from the **current partial code**
2. Opens in iframe or new tab
3. Updates as more code streams in (for iframe option)

### Implementation

1. **Add `livePreviewUrl` state:**
```typescript
const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
const [showLivePreview, setShowLivePreview] = useState(false);
```

2. **Update during streaming:**
- Every 500ms (or on each chunk), regenerate blob URL from current code
- This gives "streaming website" effect

3. **Live Preview Button in generating UI:**
```tsx
{loading && generatedCode.length > 100 && (
  <Button onClick={() => setShowLivePreview(true)}>
    <Eye className="mr-2 h-4 w-4" />
    Live Preview
  </Button>
)}
```

4. **Live Preview Modal/Panel:**
- Shows iframe with current blob URL
- Auto-refreshes every 500ms with updated code
- User sees website "building" in real-time

---

## Files to Change

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | 1. Add multi-model streaming state and function<br>2. Update UI to show 3 streaming panels in multi-model mode<br>3. Add Live Preview button and modal<br>4. Add debounced blob URL generation during streaming |

---

## Technical Details

### Multi-Model Streaming (3 parallel streams)

```typescript
const generateMultiModelStreaming = async (prompt: string) => {
  setLoading(true);
  const modelKeys = ['gpt', 'claude', 'deepseek'] as const;
  
  // Initialize all streams
  setMultiModelStreams({
    gpt: { code: '', loading: true },
    claude: { code: '', loading: true },
    deepseek: { code: '', loading: true }
  });
  
  // Start all 3 streams in parallel
  const promises = modelKeys.map(async (modelKey) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-gen`,
        {
          method: 'POST',
          headers: { ... },
          body: JSON.stringify({ 
            prompt, 
            stream: true,
            model: modelKey,
            modes: getSelectedModes()
          })
        }
      );
      
      const reader = response.body?.getReader();
      // Stream and update state for this specific model
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Parse and update multiModelStreams[modelKey].code
        setMultiModelStreams(prev => ({
          ...prev,
          [modelKey]: { ...prev[modelKey], code: prev[modelKey].code + chunk }
        }));
      }
      
      return { model: modelKey, success: true };
    } catch (error) {
      setMultiModelStreams(prev => ({
        ...prev,
        [modelKey]: { ...prev[modelKey], loading: false, error: error.message }
      }));
      return { model: modelKey, success: false };
    }
  });
  
  await Promise.allSettled(promises);
  // Show comparison modal
};
```

### Live Preview During Streaming

```typescript
// Ref to track latest code for preview
const livePreviewIntervalRef = useRef<NodeJS.Timeout>();

// Start live preview refresh when preview is opened
useEffect(() => {
  if (showLivePreview && loading && generatedCode) {
    // Update preview every 500ms
    livePreviewIntervalRef.current = setInterval(() => {
      if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
      const blob = new Blob([generatedCode], { type: 'text/html' });
      setLivePreviewUrl(URL.createObjectURL(blob));
    }, 500);
  }
  
  return () => {
    if (livePreviewIntervalRef.current) {
      clearInterval(livePreviewIntervalRef.current);
    }
  };
}, [showLivePreview, loading, generatedCode]);
```

---

## UI Layout: Multi-Model Streaming View

```text
┌─────────────────────────────────────────────────────────┐
│ Got it! Generating with 3 AI models simultaneously...  │
├─────────────────┬─────────────────┬─────────────────────┤
│ 🤖 GPT 5.2      │ 🌸 Claude       │ 🐋 DeepSeek        │
│ ░░░░░░░░░░░░░░░ │ ░░░░░░░░░░░░░░░ │ ░░░░░░░░░░░░░░░░░░ │
│ <!DOCTYPE html> │ <!DOCTYPE html> │ <!DOCTYPE html>    │
│ <html>          │ <html lang="en">│ <html>             │
│ <head>...       │ <head>...       │ <head>...          │
│ ▌ (streaming)   │ ▌ (streaming)   │ ▌ (streaming)      │
├─────────────────┴─────────────────┴─────────────────────┤
│ [Live Preview - GPT] [Live Preview - Claude] [Live...]  │
└─────────────────────────────────────────────────────────┘
```

---

## UI: Live Preview Button (Single Model)

During single-model generation:
```text
┌─────────────────────────────────────────────────────────┐
│ Got it! Creating your website...                        │
│                                                         │
│ ⏳ Working on it...                                     │
│                                                         │
│ 📄 Generating code... ▼                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ <!DOCTYPE html>                                     │ │
│ │ <html>                                              │ │
│ │ ...                                                 │ │
│ │ ▌                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [👁️ Live Preview]                                       │
└─────────────────────────────────────────────────────────┘
```

When clicked, shows streaming website in a side panel or modal!

---

## Expected Outcome

1. **Multi-Model Mode**: Users see 3 code streams side-by-side, can watch all 3 AI models working in real-time, then compare final results
2. **Live Preview**: During any generation, users can click "Live Preview" to see the website building in real-time - the ultimate "banger" feature!
