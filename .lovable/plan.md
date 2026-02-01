

# Website Generator - Complete Overhaul Plan

## Root Cause Analysis

After analyzing the code, logs, and user reports, here are the critical issues:

| Problem | Root Cause | Impact |
|---------|------------|--------|
| Haiku not working | Model `anthropic/claude-haiku-4.5` may not exist on ApiFree.ai or returns empty | No output |
| Kimi garbled output | Despite buffering fix, chunks may still corrupt due to multi-byte UTF-8 characters being split | Broken code like `color: var(--` |
| Very slow generation | No timeout handling, models may hang indefinitely | 10+ minute waits |
| Shutdown in logs | Edge function times out waiting for slow model | Lost connection |
| Single model failure = total failure | No fallback between models | Zero resilience |

## Solution: Complete Rebuild with Gemini + Fallbacks

### Strategy

1. **Add Gemini 2.5 Flash Lite as PRIMARY model** - Fast, reliable, cost-effective
2. **Implement model fallback chain** - If one fails, try next
3. **Fix UTF-8 streaming** - Use TextDecoderStream for proper character handling
4. **Add generation timeout** - 60 second max per attempt
5. **Simplify the system prompt** - Shorter = less chance of truncation

---

## Technical Changes

### File 1: `supabase/functions/web-gen/index.ts`

**Complete overhaul of the edge function:**

1. New model configuration with 3 models and fallback priority:

```typescript
const MODELS = {
  gemini: { 
    name: 'google/gemini-2.5-flash-lite',
    label: 'Gemini Flash'
  },
  haiku: { 
    name: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku'
  },
  kimi: { 
    name: 'moonshotai/kimi-k2-instruct',
    label: 'Kimi K2'
  }
};

// Fallback order when a model fails
const FALLBACK_ORDER = ['gemini', 'haiku', 'kimi'];
```

2. Simplified, more focused system prompt to reduce truncation:

```typescript
const SYSTEM_PROMPT = `You are a web developer. Generate COMPLETE HTML code only.

RULES:
1. Return ONLY valid HTML - no markdown, no backticks, no explanations
2. Start with <!DOCTYPE html>
3. End with </html>
4. Include all CSS in a <style> tag in <head>
5. Include all JavaScript in a <script> tag before </body>
6. Dark theme by default
7. Make it responsive and modern

NEVER truncate. Output must be complete.`;
```

3. Fixed UTF-8 streaming with proper TextDecoder usage:

```typescript
const transformStream = new TransformStream({
  start() {
    this.buffer = '';
    this.decoder = new TextDecoder('utf-8', { fatal: false });
  },
  transform(chunk, controller) {
    // Decode with streaming=true to handle multi-byte chars
    this.buffer += this.decoder.decode(chunk, { stream: true });
    
    // Only process complete lines
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  },
  flush(controller) {
    // Flush remaining decoder buffer
    this.buffer += this.decoder.decode();
    // Process any remaining lines
    if (this.buffer.startsWith('data: ')) {
      // ... process remaining
    }
    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
  }
});
```

4. Add timeout with AbortController:

```typescript
async function callAPIStream(apiKey: string, prompt: string, modelConfig: { name: string }): Promise<ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create a website: ${prompt}` }
        ],
        stream: true,
        max_tokens: 8192  // Limit output size
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }
    
    return response.body!;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

5. Model fallback logic in main handler:

```typescript
// If user-selected model fails, try fallbacks
const modelsToTry = [model, ...FALLBACK_ORDER.filter(m => m !== model)];

for (const modelKey of modelsToTry) {
  const modelConfig = MODELS[modelKey];
  console.log(`[web-gen] Trying model: ${modelConfig.name}`);
  
  for (const apiKey of shuffledKeys) {
    try {
      const stream = await callAPIStream(apiKey, prompt, modelConfig);
      // Return transformed stream on success
      return new Response(stream.pipeThrough(transformStream), { ... });
    } catch (error) {
      console.error(`[web-gen] ${modelConfig.name} failed:`, error.message);
      // Continue to next key or model
    }
  }
}
```

---

### File 2: `src/pages/WebGen.tsx`

**Update frontend to support 3 models:**

1. Update type and labels:

```typescript
type ModelType = 'gemini' | 'haiku' | 'kimi';

const MODEL_LABELS = {
  gemini: 'Gemini Flash',
  haiku: 'Claude Haiku',
  kimi: 'Kimi K2'
};

const LOADING_MESSAGES = {
  gemini: [
    'Connecting to Gemini Flash...',
    'Analyzing your request...',
    // ...
  ],
  haiku: [...],
  kimi: [...]
};
```

2. Update default model to Gemini:

```typescript
const [selectedModel, setSelectedModel] = useState<ModelType>('gemini');
```

3. Update model selector UI to 3 buttons:

```tsx
<div className="flex gap-2">
  <Button
    variant={selectedModel === 'gemini' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('gemini')}
    disabled={loading}
    className="flex-1 gap-1"
  >
    <Zap className="h-3.5 w-3.5" />
    Gemini
    <span className="text-xs opacity-70">(Fast)</span>
  </Button>
  <Button
    variant={selectedModel === 'haiku' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('haiku')}
    disabled={loading}
    className="flex-1 gap-1"
  >
    <Sparkles className="h-3.5 w-3.5" />
    Haiku
  </Button>
  <Button
    variant={selectedModel === 'kimi' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('kimi')}
    disabled={loading}
    className="flex-1 gap-1"
  >
    <Sparkles className="h-3.5 w-3.5" />
    Kimi
  </Button>
</div>
```

4. Add frontend timeout handling:

```typescript
const generateWebsite = async () => {
  // ... existing setup ...
  
  try {
    // Add 90 second timeout on frontend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-gen`,
      {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          stream: true,
          model: selectedModel
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    // ... rest of streaming logic
  } catch (error) {
    if (error.name === 'AbortError') {
      toast({
        title: "Generation timed out",
        description: "The AI took too long. Try a simpler prompt or different model.",
        variant: "destructive"
      });
    }
    // ...
  }
};
```

---

## Summary of Changes

| File | Key Changes |
|------|-------------|
| `supabase/functions/web-gen/index.ts` | Add Gemini model, fix UTF-8 streaming, add timeout, add model fallback, simplify prompt |
| `src/pages/WebGen.tsx` | Add Gemini option, default to Gemini, add frontend timeout |

---

## Expected Results After Implementation

- Gemini Flash as fast, reliable default option
- Proper UTF-8 handling prevents garbled characters
- 60s timeout prevents infinite hangs
- Model fallback ensures at least one model works
- Simpler prompt reduces truncation issues
- Frontend timeout prevents stuck UI

---

## Why This Will Work

1. **Gemini 2.5 Flash Lite** is designed for speed and reliability at scale
2. **Proper TextDecoder streaming** handles multi-byte characters correctly
3. **Fallback chain** means if Gemini fails, Haiku is tried, then Kimi
4. **Timeouts** prevent the edge function from hanging indefinitely
5. **Simpler prompt** gives the AI clearer instructions with less room for error

