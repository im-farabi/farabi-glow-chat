
# Fix Enhance Video Prompt - Use OpenAI with Grok Fallback

## Problem
The current function uses `openai-fast` model with `max_tokens: 500`, which maps to a reasoning model that uses all tokens for internal reasoning, leaving nothing for output.

## Solution
Use `openai` as primary model with `grok` as fallback - same pattern as the working `generate-suggestions` function.

---

## File to Modify

### `supabase/functions/enhance-video-prompt/index.ts`

**Changes:**

1. **Try `openai` model first** (lines 87-102)
2. **If it fails, fallback to `grok` model** (add fallback logic)
3. **Remove `max_tokens: 500`** - let API decide appropriate length

**Updated logic:**

```text
1. Try with model: 'openai'
2. If response not ok → log error, retry with model: 'grok'
3. If grok also fails → return error
4. Otherwise return enhanced prompt
```

---

## Code Changes (lines 87-122)

**Before:**
```typescript
const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
  ...
  body: JSON.stringify({
    model: 'openai-fast',
    messages: [...],
    max_tokens: 500,
    temperature: 0.7,
  }),
});

if (!response.ok) {
  // return error immediately
}
```

**After:**
```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: `Transform this basic prompt into an optimized video prompt: "${prompt}"` }
];

// Try openai first
console.log('Trying openai model...');
let response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'openai',
    messages,
    temperature: 0.7,
  }),
});

// Fallback to grok if openai fails
if (!response.ok) {
  const errorText = await response.text();
  console.error('openai failed:', response.status, errorText);
  console.log('Trying grok fallback...');
  
  response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok',
      messages,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const grokError = await response.text();
    console.error('grok also failed:', response.status, grokError);
    return new Response(
      JSON.stringify({ error: 'Failed to enhance prompt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  console.log('grok fallback succeeded');
} else {
  console.log('openai succeeded');
}
```

---

## Summary

| Change | Before | After |
|--------|--------|-------|
| Primary model | `openai-fast` | `openai` |
| Fallback | None | `grok` |
| max_tokens | 500 (causes issue) | Removed |
| Pattern | Single attempt | Try primary → fallback |
