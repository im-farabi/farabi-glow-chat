

# Fix Giyaat API Integration - Switch to POST with Streaming

## Problem Identified

The current `giyaat-proxy` Edge Function uses **GET requests with query parameters**:
```typescript
const url = `https://giyaaat.vercel.app/api/chat?prompt=${encodedPrompt}&model=${selectedModel}`;
const response = await fetch(url, { signal: controller.signal });
```

But the actual Giyaat API (from your code) requires **POST requests with JSON body** and returns **SSE streaming**:
```javascript
// Giyaat expects:
POST https://giyaaat.vercel.app/api/chat
Body: { prompt: "...", model: "fast" }
Returns: SSE stream with `data: {"content": chunk}\n\n`
```

This is why you're getting `400 Bad Request` errors.

---

## Solution

Update the edge function to:
1. Use **POST** method with JSON body
2. Handle **SSE streaming** response
3. Collect chunks and return full text

---

## File Changes

### `supabase/functions/giyaat-proxy/index.ts`

**Current (broken):**
```typescript
// GET request with query params
const encodedPrompt = encodeURIComponent(prompt);
const url = `https://giyaaat.vercel.app/api/chat?prompt=${encodedPrompt}&model=${selectedModel}`;
const response = await fetch(url, { signal: controller.signal });
const text = await response.text();
```

**Fixed:**
```typescript
// POST request with JSON body
const response = await fetch('https://giyaaat.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, model: selectedModel }),
  signal: controller.signal
});

// Parse SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let fullText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.replace(/^data: ?/, '').trim();
    if (payload === '[DONE]') break;
    
    try {
      const parsed = JSON.parse(payload);
      if (parsed.content) fullText += parsed.content;
    } catch {}
  }
}

return new Response(JSON.stringify({ text: fullText }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

---

## Complete Updated Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }
    
    if (prompt.length > 1000) {
      throw new Error('Prompt too long (max 1000 characters)');
    }
    
    const validModels = ['fast', 'mid', 'large'];
    const selectedModel = validModels.includes(model) ? model : 'fast';
    
    console.log('Giyaat proxy request:', { model: selectedModel, promptLength: prompt.length });
    
    // Timeout handling (60 seconds for streaming)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    // POST request with JSON body (matching Giyaat API)
    const response = await fetch('https://giyaaat.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: selectedModel }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Giyaat API error:', response.status, errorText);
      throw new Error(`Giyaat API error: ${response.status}`);
    }
    
    // Parse SSE streaming response
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.replace(/^data: ?/, '').trim();
        if (payload === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) {
            fullText += parsed.content;
          }
        } catch {
          // Partial JSON, continue
        }
      }
    }
    
    // Handle any remaining buffer
    if (buffer.trim() && buffer.startsWith('data:')) {
      const payload = buffer.replace(/^data: ?/, '').trim();
      if (payload !== '[DONE]') {
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) fullText += parsed.content;
        } catch {}
      }
    }
    
    if (!fullText) {
      throw new Error('Empty response from GIYAAT');
    }
    
    console.log('Giyaat proxy success:', { model: selectedModel, responseLength: fullText.length });
    
    return new Response(JSON.stringify({ text: fullText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Giyaat proxy error:', error);
    let errorMessage = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. GIYAAT server may be slow.';
        errorCode = 'TIMEOUT';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Could not reach GIYAAT server. Please try again.';
        errorCode = 'CONNECTION_ERROR';
      } else {
        errorMessage = error.message;
        errorCode = 'API_ERROR';
      }
    }
    
    return new Response(JSON.stringify({ error: errorMessage, code: errorCode }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Summary of Changes

| Aspect | Before (broken) | After (fixed) |
|--------|-----------------|---------------|
| HTTP Method | GET | POST |
| Request Format | Query params (`?prompt=...`) | JSON body (`{ prompt, model }`) |
| Response Handling | `response.text()` | SSE stream parsing |
| Stream Format | Not handled | `data: {"content": chunk}\n\n` |
| Timeout | 45 seconds | 60 seconds (streaming needs more time) |
| Max prompt | No limit | 1000 characters (matches API) |

---

## Why This Fixes It

The Giyaat API code you shared shows:
1. It only accepts **POST** requests (GET returns 400)
2. It expects `{ prompt, model }` in the request body
3. It returns SSE stream with `data: {"content": chunk}\n\n` format
4. It ends with `data: [DONE]\n\n`

The current edge function was using GET with URL-encoded prompt, which the API rejects with 400.

