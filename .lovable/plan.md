

# Fix GIYAAT Long Prompt Timeout Issue

## Problem Identified

When you selected **GIYAAT mode** from the Toolbox and sent a long code request, the request failed because:

1. **GIYAAT uses GET request with prompt in URL** - Long prompts create extremely long URLs
2. **45-second timeout hit** - The GIYAAT server took too long to process code generation
3. **No fallback** - When GIYAAT fails, there's no automatic fallback to another model

**Evidence from logs:**
```text
giyaat-proxy | 500 | execution_time: 45,208ms
Error: AbortError: The signal has been aborted
```

---

## Solution: Multi-Layer Fix

### Option A: Switch GIYAAT to POST Method (Recommended)
Change from GET with URL params to POST with body - this allows unlimited prompt length.

### Option B: Add Fallback to Regular Models
When GIYAAT fails, automatically retry with the normal Pollinations API.

### Option C: UI Warning for Long Prompts
Warn users when prompt is too long for GIYAAT and suggest switching modes.

**Recommended approach:** Implement Option A + Option B together.

---

## Files to Modify

### 1. `supabase/functions/giyaat-proxy/index.ts`

**Current (broken for long prompts):**
```typescript
const encodedPrompt = encodeURIComponent(prompt);
const url = `https://giyaaat.vercel.app/api/chat?prompt=${encodedPrompt}&model=${selectedModel}`;
const response = await fetch(url, { signal: controller.signal });
```

**Fixed (POST method + longer timeout + retry):**
```typescript
// Increase timeout to 90 seconds for code generation
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90000);

// Use POST method to avoid URL length limits
const response = await fetch('https://giyaaat.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, model: selectedModel }),
  signal: controller.signal
});
```

**Note:** This requires GIYAAT API to support POST. If it doesn't, we need Option B.

### 2. Alternative: `src/lib/api.ts` - Add Fallback

If GIYAAT fails, automatically retry with `sendNormal()`:

```typescript
export async function sendGiyaat(
  prompt: string,
  model: 'fast' | 'mid' | 'large' = 'fast'
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('giyaat-proxy', {
      body: { prompt, model }
    });
    
    if (error || !data?.text) {
      console.warn('GIYAAT failed, falling back to normal mode');
      // Fallback to normal mode
      return await sendNormal(prompt, []);
    }
    
    return data.text;
  } catch (error) {
    console.error('sendGiyaat error, using fallback:', error);
    return await sendNormal(prompt, []);
  }
}
```

### 3. `src/components/ChatInput.tsx` - Add UI Warning

Show a tooltip/warning when GIYAAT mode is selected with long prompts:

```tsx
// Add prompt length check before sending
const handleSend = () => {
  if (activeMode.startsWith('giyaat') && message.length > 2000) {
    toast({
      title: "Long prompt detected",
      description: "For best results with code generation, try 'Coder' mode instead.",
      variant: "default"
    });
  }
  // ... rest of send logic
};
```

---

## Implementation Summary

| File | Change |
|------|--------|
| `supabase/functions/giyaat-proxy/index.ts` | Switch to POST method, increase timeout to 90s |
| `src/lib/api.ts` | Add automatic fallback to `sendNormal()` when GIYAAT fails |
| `src/components/ChatInput.tsx` | Add warning toast for long prompts in GIYAAT mode |

---

## Why This Fixes It

| Problem | Solution |
|---------|----------|
| URL too long | POST method sends prompt in body (no length limit) |
| 45s timeout too short | Increase to 90s for code generation |
| No fallback | Auto-retry with Pollinations API if GIYAAT fails |
| User confusion | Toast message suggests better mode for long prompts |

