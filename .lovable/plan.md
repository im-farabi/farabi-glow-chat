

# Fix Claude 4.5 Slow Response & Update Loading Text

## Summary
Two fixes needed:
1. Update loading stage text from "GPT-5.2" to "Claude 4.5"
2. Reduce perceived delay by stopping the loading animation immediately when first chunk arrives

---

## What's Actually Happening

### Instructions & Messages - Working Fine
The system prompt and message history ARE being sent correctly:
- System prompt sent via `systemPrompt` field
- Last 6 messages (3 exchanges) sent for context
- Edge function builds `fullMessages` array with system prompt + conversation

### Why 7 Seconds?
The delay has three causes:

| Cause | Time | Fix? |
|-------|------|------|
| Supabase Edge Function cold start | ~2-3s first call | Can't fix |
| Claude API thinking time | ~2-3s | Can't fix |
| Loading animation keeps showing | Until all chunks done | Can fix |

The loading stages still say "GPT-5.2" and the interval keeps running even after streaming starts, making it *feel* slower than it is.

---

## Changes Required

### 1. Update Loading Text in Index.tsx

Change GPT-5.2 references to Claude 4.5:

```typescript
const gpt52Stages = [
  { time: 500, text: 'Connecting to Claude...' },
  { time: 1500, text: 'Processing with Claude 4.5...' },
  { time: 3000, text: 'Generating response...' },
  { time: Infinity, text: 'Thinking deeply...' }
];
```

### 2. Stop Loading Animation When First Chunk Arrives

Currently the `updateInterval` that shows loading stages keeps running. When streaming starts, we should:
1. Clear the interval immediately
2. The `isLoading: false` already stops the loading UI

The fix: Move the interval reference to be accessible inside the streaming callback, and clear it on first chunk.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Update "GPT-5.2" text to "Claude 4.5" in loading stages, clear interval when streaming starts |

---

## Why Some Delay Is Unavoidable

1. **Cold Start**: First request to the edge function takes ~2-3s to spin up
2. **API Processing**: Claude needs ~1-2s to start generating
3. **Network Latency**: Round trip to Supabase then to API

After the first message, subsequent requests should be faster (~2-3s total) because:
- Edge function is already warm
- Claude API connection is cached

---

## Expected Result After Fix

- Loading text says "Claude 4.5" instead of "GPT-5.2"
- Loading animation stops immediately when first word appears
- Streaming text shows word-by-word as it arrives
- First response: ~3-4s (unavoidable cold start)
- Subsequent responses: ~2-3s

