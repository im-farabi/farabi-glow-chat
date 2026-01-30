
# Fix GPT 5.2 Streaming Display and Object Error

## Summary
Two bugs need fixing:
1. **Streaming not visible**: The UI shows loading animation instead of streaming text because `isLoading` stays `true` while chunks are being received
2. **"[object] [object]" error**: The `generate-suggestions` edge function sometimes returns invalid JSON, causing object rendering errors

---

## Root Causes

### Streaming Issue
The current flow:
1. User sends message, `isLoading = true`
2. Loading message added with `content: ''` and `isLoading: true`
3. Chunks arrive and update `content` via `onChunk` callback
4. ChatMessage component checks `isLoading` first - if true, shows spinner instead of content
5. User sees spinner the entire time, then suddenly full response appears

The fix: When streaming chunks arrive, set `isLoading = false` so the content renders while keeping the message updating in real-time.

### Object Error Issue
The `generate-suggestions` edge function sometimes gets non-JSON responses from the AI, and the error handling converts errors to `[object Object]` when rendered.

---

## Changes Required

### 1. Fix Streaming Display in Index.tsx
Modify the GPT 5.2 onChunk callback to:
- Set `isLoading = false` on first chunk so content becomes visible
- Keep appending chunks to `content`

```typescript
case 'gpt52':
  response = await sendGPT52(message, messages, (chunk) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastMsg = updated[updated.length - 1];
      if (lastMsg) {
        // Turn off loading so content renders
        lastMsg.isLoading = false;
        lastMsg.content = (lastMsg.content || '') + chunk;
      }
      return updated;
    });
  });
  break;
```

### 2. Fix generate-suggestions Error Handling
Update the edge function to:
- Better validate JSON before returning
- Return a fallback array if parsing fails instead of throwing
- Ensure the AI prompt is stricter about JSON-only output

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Set `isLoading = false` in GPT 5.2 streaming callback |
| `supabase/functions/generate-suggestions/index.ts` | Improve JSON parsing and error handling |

---

## Technical Details

### Index.tsx Streaming Fix
The key insight is that `isLoading` controls whether the content or spinner shows. By setting `isLoading = false` when the first chunk arrives, the streaming content becomes visible immediately.

### Generate-suggestions Fix
The current error logs show:
```
Raw suggestions response: What are the specific criteria for "education quality"?
Failed to parse suggestions JSON: SyntaxError: Unexpected token 'W'
```

The AI is returning plain text questions instead of a JSON array. The fix:
1. Add retry logic with a stricter prompt
2. Use a fallback empty array `[]` instead of throwing
3. Extract JSON array from response even if wrapped in markdown

---

## Expected Behavior After Fix

1. **GPT 5.2 Mode**: Text appears word-by-word as it streams in, similar to ChatGPT's typing effect
2. **Suggestions**: Either show valid suggestions or gracefully hide the section - no `[object Object]` errors
