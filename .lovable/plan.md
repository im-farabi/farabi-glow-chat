

# Fix Website Generator - Critical Issues

## Problems Identified

| Issue | Root Cause | Solution |
|-------|------------|----------|
| Auto-scroll not working | `overflow-auto` needs explicit height and the container might not be scrolling properly | Add explicit height + use `overflow-y-scroll` to always show scrollbar |
| Haiku doesn't work | Model name might be wrong OR API is rejecting it | Keep Haiku but add better error handling and fallback |
| Kimi produces corrupted/garbled code | SSE stream chunks can split mid-line, causing data loss in the transform | Buffer incomplete lines and only process complete lines |
| No manual scroll option | Container doesn't allow scrolling when user wants to review code | Always enable scrolling with visible scrollbar |

---

## Technical Changes

### File 1: `supabase/functions/web-gen/index.ts`

**Fix SSE stream buffering to prevent data corruption:**

The current transform processes each chunk independently, but SSE lines can be split across chunks. Need to buffer incomplete lines:

```typescript
const transformStream = new TransformStream({
  buffer: '',
  transform(chunk, controller) {
    // Append new chunk to buffer
    this.buffer += new TextDecoder().decode(chunk);
    
    // Process complete lines only
    const lines = this.buffer.split('\n');
    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  },
  flush(controller) {
    // Process any remaining buffered content
    if (this.buffer.startsWith('data: ')) {
      const data = this.buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch {}
      }
    }
    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
  }
});
```

---

### File 2: `src/pages/WebGen.tsx`

**1. Fix code container to always allow scrolling:**

Change the code container to have explicit scroll behavior:

```tsx
<div 
  ref={codeContainerRef}
  className="h-full overflow-y-scroll rounded-lg bg-background/80 border border-border/50"
  style={{ maxHeight: '100%' }}
>
```

**2. Improve auto-scroll with a small delay for DOM to update:**

```typescript
useEffect(() => {
  if (codeContainerRef.current && generatedCode) {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        if (codeContainerRef.current) {
          codeContainerRef.current.scrollTo({
            top: codeContainerRef.current.scrollHeight,
            behavior: 'auto' // instant scroll during streaming
          });
        }
      });
    }, 0);
    return () => clearTimeout(timeoutId);
  }
}, [generatedCode]);
```

**3. Add user scroll detection to pause auto-scroll:**

```typescript
const [userScrolled, setUserScrolled] = useState(false);

// Reset userScrolled when new generation starts
useEffect(() => {
  if (loading) {
    setUserScrolled(false);
  }
}, [loading]);

// Detect if user manually scrolls up
const handleScroll = () => {
  if (!codeContainerRef.current) return;
  const { scrollTop, scrollHeight, clientHeight } = codeContainerRef.current;
  // If user scrolls more than 100px from bottom, they're reviewing
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  setUserScrolled(!isNearBottom);
};

// Only auto-scroll if user hasn't scrolled away
useEffect(() => {
  if (codeContainerRef.current && generatedCode && !userScrolled) {
    // auto-scroll logic
  }
}, [generatedCode, userScrolled]);
```

**4. Add onScroll handler to the container:**

```tsx
<div 
  ref={codeContainerRef}
  onScroll={handleScroll}
  className="h-full overflow-y-scroll rounded-lg bg-background/80 border border-border/50"
>
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/web-gen/index.ts` | Fix SSE stream buffering to prevent character loss, add flush handler |
| `src/pages/WebGen.tsx` | Fix scrolling with `overflow-y-scroll`, add user scroll detection, improve auto-scroll timing |

---

## Expected Results

- Code streams without missing characters (no more garbled output)
- Container is always scrollable (you can manually scroll anytime)
- Auto-scroll works during streaming but pauses if you scroll up to review
- Auto-scroll resumes if you scroll back to bottom

