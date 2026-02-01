

# Fix Multi-Model Beta: Stream Requirement for Large Tokens

## Problem

The Pollinations API has a constraint:
- **`max_tokens > 4096` requires `stream: true`**

The multi-model feature uses `generateNonStreaming` with `stream: false` and `max_tokens: 16384`, which causes a 400 error.

## Solution

For multi-model mode, we need to either:
1. Use streaming and collect the full response, OR
2. Reduce `max_tokens` to 4096 for non-streaming

**Best approach**: Use streaming but collect the full response into a string (not pipe to client). This allows us to keep the 16384 token limit for complete website generation.

---

## File Changes

**File: `supabase/functions/web-gen/index.ts`**

### Change 1: Rewrite `generateNonStreaming` to use streaming internally

Replace the non-streaming fetch with a streaming fetch that collects all chunks:

```typescript
async function generateWithStreaming(
  apiKey: string,
  prompt: string,
  modelConfig: { name: string; label: string },
  systemPrompt: string,
  timeoutMs: number = 120000  // Increase timeout for full generation
): Promise<{ code: string; model: string; time: number }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`[web-gen] Multi-model: Calling ${modelConfig.name} (streaming)...`);
    
    const response = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true,  // Must be true for max_tokens > 4096
        max_tokens: 16384,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText.slice(0, 200)}`);
    }
    
    // Collect all streamed content
    let fullContent = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) throw new Error('No response body');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
    
    // Clean up code
    let cleanedCode = fullContent
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
      
    if (!cleanedCode.startsWith('<!DOCTYPE')) {
      const doctypeIndex = cleanedCode.indexOf('<!DOCTYPE');
      if (doctypeIndex > 0) cleanedCode = cleanedCode.substring(doctypeIndex);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[web-gen] ${modelConfig.label} completed in ${elapsed}ms, ${cleanedCode.length} chars`);
    
    return {
      code: cleanedCode,
      model: modelConfig.label,
      time: elapsed
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}
```

### Change 2: Update multi-model mode to use new function

Update line 390 to call `generateWithStreaming` instead of `generateNonStreaming`:

```typescript
const results = await Promise.allSettled(
  modelKeys.map(key => 
    generateWithStreaming(pollinationsKey, prompt, MODELS[key], systemPrompt)
  )
);
```

### Change 3: Increase timeout for multi-model

Since we're generating 3 complete websites in parallel, increase the timeout from 90s to 120s to give models enough time.

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Lines 291-353 | Rename to `generateWithStreaming`, change `stream: false` to `stream: true`, add chunk collection logic |
| Line 296 | Increase timeout from 90000 to 120000 ms |
| Line 390 | Call `generateWithStreaming` instead of `generateNonStreaming` |

---

## Expected Result

After this fix:
- Multi-model beta will use streaming internally (as required by Pollinations API)
- All 3 models will generate complete websites without the 400 error
- Results will be collected and returned as JSON for comparison view

