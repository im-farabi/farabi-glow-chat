
# Fix GPT 5.2 Streaming - Immutable State Update

## The Problem
The streaming chunks are arriving correctly from the API, but the UI doesn't update in real-time. The text only appears once the entire response is complete.

## Root Cause
In `Index.tsx`, the streaming callback **mutates** the message object directly:
```typescript
lastMsg.isLoading = false;
lastMsg.content = (lastMsg.content || '') + chunk;
```

This breaks React's change detection because:
1. `ChatMessage` uses `React.memo` with a custom equality check
2. The comparison `prevProps.content === nextProps.content` returns `true` because both point to the same mutated string
3. React skips re-rendering since it thinks nothing changed

## The Fix
Create **new objects** instead of mutating existing ones. This ensures React detects the change and re-renders.

---

## Changes Required

### File: `src/pages/Index.tsx`

Update the GPT 5.2 `onChunk` callback to create new array and message objects:

**Before (broken - mutates in place):**
```typescript
case 'gpt52':
  response = await sendGPT52(message, messages, (chunk) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastMsg = updated[updated.length - 1];
      if (lastMsg) {
        lastMsg.isLoading = false;  // Mutation!
        lastMsg.content = (lastMsg.content || '') + chunk;  // Mutation!
      }
      return updated;
    });
  });
```

**After (fixed - creates new objects):**
```typescript
case 'gpt52':
  response = await sendGPT52(message, messages, (chunk) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const lastMsg = updated[lastIndex];
      if (lastMsg) {
        // Create NEW object to trigger React re-render
        updated[lastIndex] = {
          ...lastMsg,
          isLoading: false,
          content: (lastMsg.content || '') + chunk
        };
      }
      return updated;
    });
  });
```

---

## Why This Works
1. Spreading `...lastMsg` creates a new message object
2. New object has a new reference
3. React's memo comparison sees `prevProps.content !== nextProps.content`
4. Component re-renders with each chunk, showing real-time streaming

---

## Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Fix immutability in GPT 5.2 streaming callback |

This is **our fault** (the frontend code), not the API's fault. The API is streaming correctly.
