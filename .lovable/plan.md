

# Fix Giyaat Proxy URL Construction

## Problem
The edge function is constructing the wrong URL format for the Giyaat API.

**Current (broken):**
```
https://giyaaat.vercel.app/{prompt}?model=fast
```

**Required (per your api/chat.js):**
```
https://giyaaat.vercel.app/api/chat?prompt={prompt}&model=fast
```

---

## File to Modify

### `supabase/functions/giyaat-proxy/index.ts`

**Change line ~30 from:**
```typescript
const url = `https://giyaaat.vercel.app/${encodedPrompt}?model=${selectedModel}`;
```

**To:**
```typescript
const url = `https://giyaaat.vercel.app/api/chat?prompt=${encodedPrompt}&model=${selectedModel}`;
```

---

## Summary
Single line fix - change the URL construction to match your Giyaat API's expected format with `/api/chat` endpoint and `prompt` as a query parameter.

