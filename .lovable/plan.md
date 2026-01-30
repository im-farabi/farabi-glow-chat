

# Add Live Streaming to GIYAAT AI Chat

## Problem

Currently GIYAAT responses appear all at once because:

1. **Edge Function buffers everything**: The `giyaat-proxy` collects ALL chunks from Giyaat's SSE stream before returning
2. **Frontend waits for complete response**: `sendGiyaat()` uses `supabase.functions.invoke()` which waits for full JSON response

The user expects live typing like other chat apps where text appears word-by-word.

---

## Solution Architecture

```text
Current (broken):
┌───────────┐    ┌────────────────┐    ┌──────────────┐
│ Giyaat API├───►│ Edge Function  ├───►│ Frontend     │
│ (SSE)     │    │ (buffers ALL)  │    │ (shows once) │
└───────────┘    └────────────────┘    └──────────────┘

Fixed (streaming):
┌───────────┐    ┌────────────────┐    ┌──────────────┐
│ Giyaat API├───►│ Edge Function  ├───►│ Frontend     │
│ (SSE)     │    │ (forwards SSE) │    │ (live typing)│
└───────────┘    └────────────────┘    └──────────────┘
```

---

## Files to Modify

### 1. Edge Function: Forward SSE Stream

**File: `supabase/functions/giyaat-proxy/index.ts`**

Instead of buffering all chunks, forward the SSE stream directly to the frontend using `TransformStream`:

```typescript
// Create a transform stream to forward SSE data
const { readable, writable } = new TransformStream();
const writer = writable.getWriter();

// Return streaming response immediately
const streamResponse = new Response(readable, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});

// Read from Giyaat and forward chunks
(async () => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Forward raw SSE data to frontend
    await writer.write(value);
  }
  await writer.close();
})();

return streamResponse;
```

### 2. Frontend: Add Streaming Handler

**File: `src/lib/api.ts`**

Create a new `sendGiyaatStream()` function that:
- Uses raw `fetch()` instead of `supabase.functions.invoke()`
- Reads SSE chunks with `response.body.getReader()`
- Calls an `onChunk` callback to update UI in real-time

```typescript
export async function sendGiyaatStream(
  prompt: string,
  model: 'fast' | 'mid' | 'large',
  onChunk: (text: string, done: boolean) => void
): Promise<string> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/giyaat-proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, model })
    }
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    // Parse SSE chunks and call onChunk
    // ...accumulate fullText and call onChunk(fullText, false)
  }
  
  onChunk(fullText, true); // Final call
  return fullText;
}
```

### 3. Index.tsx: Update GIYAAT Message Handling

**File: `src/pages/Index.tsx`**

Update the GIYAAT cases to:
1. Add an empty assistant message immediately
2. Update message content as chunks arrive (like BookChatPanel does)

```typescript
case 'giyaatFast':
case 'giyaatMid':
case 'giyaatLarge':
  // Add empty assistant message for streaming
  const streamingMessages = [...newMessages, { role: 'assistant', content: '', isStreaming: true }];
  setMessages(streamingMessages);
  
  // Stream with live updates
  response = await sendGiyaatStream(
    message, 
    mode === 'giyaatFast' ? 'fast' : mode === 'giyaatMid' ? 'mid' : 'large',
    (text, done) => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming) {
          last.content = text;
          if (done) last.isStreaming = false;
        }
        return updated;
      });
    }
  );
  break;
```

---

## Technical Details

### SSE Format from Giyaat API
```text
data: {"content":"Hello"}

data: {"content":" world"}

data: [DONE]
```

### Edge Function Headers for Streaming
```typescript
{
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
}
```

### Frontend SSE Parsing
```typescript
for (const line of lines) {
  if (!line.startsWith('data:')) continue;
  const payload = line.replace(/^data: ?/, '').trim();
  if (payload === '[DONE]') break;
  
  const parsed = JSON.parse(payload);
  if (parsed.content) {
    fullText += parsed.content;
    onChunk(fullText, false);
  }
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/giyaat-proxy/index.ts` | Forward SSE stream instead of buffering |
| `src/lib/api.ts` | Add `sendGiyaatStream()` with `onChunk` callback |
| `src/pages/Index.tsx` | Update GIYAAT cases to use streaming + live UI updates |

---

## Result

After these changes, GIYAAT responses will appear character-by-character in real-time, just like the Book Chat feature does.

