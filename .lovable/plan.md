
# Fix WebGen: API Returning Empty Responses

## Problem Diagnosis

**Root Cause**: The `apifree.ai` API is returning empty or invalid responses across ALL 3 API keys.

**Evidence**:
- Edge function logs show "Success" (200 status)
- But actual response body is empty → stream sends `[DONE]` immediately
- Non-streaming test shows: `"Response is not valid HTML"` 
- All 3 models (gemini, haiku, kimi) fail the same way
- All 3 API keys fail

**Conclusion**: The apifree.ai service is either:
1. Out of quota on all keys
2. Rate limiting requests
3. Returning error messages instead of HTML (which the code ignores)

---

## Solution: Add Debug Logging + Fallback to Pollinations

### Part 1: Add Better Logging to See Actual API Response

Currently the code doesn't log what the API actually returns. Add logging to see if it's an error message.

**File: `supabase/functions/web-gen/index.ts`**

Add logging before returning the stream:
```typescript
// Before piping through transform stream, read a preview
const [stream1, stream2] = upstreamStream.tee();
const previewReader = stream2.getReader();
const { value } = await previewReader.read();
if (value) {
  const preview = new TextDecoder().decode(value).slice(0, 500);
  console.log(`[web-gen] Response preview: ${preview}`);
}
```

For non-streaming, log the actual response:
```typescript
const data = await response.json();
console.log(`[web-gen] Full response:`, JSON.stringify(data).slice(0, 1000));
```

### Part 2: Use Pollinations as Fallback

The project already has `POLLINATIONS_API_KEY` configured. Add Pollinations as a fallback when apifree.ai fails.

**Add to MODELS config**:
```typescript
const MODELS = {
  // ... existing models
  pollinations: {
    name: 'openai-large',
    label: 'Pollinations GPT',
    apiUrl: 'https://text.pollinations.ai/openai'
  }
};
```

**Update fallback order**:
```typescript
const FALLBACK_ORDER = ['gemini', 'haiku', 'kimi', 'pollinations'];
```

**Add Pollinations API call logic**:
```typescript
if (modelKey === 'pollinations') {
  const pollinationsKey = Deno.env.get('POLLINATIONS_API_KEY');
  // Use Pollinations API with OpenAI-compatible format
}
```

### Part 3: Improve Error Handling in Frontend

Currently the frontend shows a generic "Generation incomplete" error. Make it more helpful:

```typescript
// In catch block
if (error.message?.includes('invalid HTML')) {
  toast({
    title: "API temporarily unavailable",
    description: "Please try again in a moment or try a different model",
    variant: "destructive"
  });
}
```

---

## Files to Change

| File | Changes |
|------|---------|
| `supabase/functions/web-gen/index.ts` | 1. Add response preview logging<br>2. Add Pollinations as fallback API<br>3. Better error messages in response |

---

## Alternative Quick Fix

If you want to test immediately without code changes:

1. Check apifree.ai dashboard for remaining quota
2. Generate new API keys if quota is exhausted
3. Test with a simpler prompt to verify API works

---

## Expected Outcome

After these changes:
- Logs will show exactly what the API returns (error message or empty)
- If apifree.ai fails, Pollinations will be tried as backup
- Users get clearer error messages about what went wrong
