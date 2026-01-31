

# Fix: Better Error Messages for GPT Image Failures

## What Happened

The GPT Image 1.5 model (`gptimage-large`) failed with a **content moderation block**:
```
"message": "Your request was rejected by the safety system"
"code": "moderation_blocked"
```

This is NOT a bug - it's OpenAI's safety filter rejecting the prompt. However, the user sees a generic "Generation failed" error instead of understanding why.

---

## Solution

Parse the Pollinations API error response and extract meaningful messages for users.

---

## Changes Required

### 1. Update Edge Function: `supabase/functions/image-gen-multi/index.ts`

**Current behavior:**
```typescript
throw new Error(`Image generation failed: ${response.status}`);
```

**New behavior:**
```typescript
// Parse error response for detailed message
try {
  const errorData = JSON.parse(errorText);
  const innerError = errorData.error?.message;
  
  // Try to extract the actual error reason
  if (innerError && innerError.includes('moderation_blocked')) {
    throw new Error('Content blocked by safety filter');
  } else if (innerError && innerError.includes('rate_limit')) {
    throw new Error('Rate limit exceeded, try again');
  } else {
    throw new Error(innerError || `Generation failed: ${response.status}`);
  }
} catch (parseErr) {
  throw new Error(`Generation failed: ${response.status}`);
}
```

### 2. Update Frontend: `src/pages/ImageGen.tsx`

Show a more descriptive error on the image card when blocked:

**Current:**
```typescript
<p className="text-red-400 text-xs text-center">{img.error}</p>
```

**Enhanced:**
```typescript
// Show appropriate icon for different error types
{img.error?.includes('safety') || img.error?.includes('blocked') ? (
  <p className="text-yellow-400 text-xs text-center">⚠️ {img.error}</p>
) : (
  <p className="text-red-400 text-xs text-center">❌ {img.error}</p>
)}
```

---

## Error Types to Handle

| Error | User Message | Icon |
|-------|--------------|------|
| moderation_blocked | "Content blocked by safety filter" | ⚠️ Yellow |
| rate_limit | "Rate limit exceeded, try again" | 🔄 |
| timeout | "Generation timed out" | ⏱️ |
| Other | Generic error message | ❌ Red |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/image-gen-multi/index.ts` | Parse error response, extract meaningful error messages |
| `src/pages/ImageGen.tsx` | Show color-coded error messages on cards |

---

## Behavior After Fix

1. User enters prompt + reference image
2. 5 models generate simultaneously
3. GPT Image 1.5 gets blocked by safety filter
4. Instead of "Generation failed: 400", user sees:
   - **"Content blocked by safety filter"** in yellow
5. Other 4 models complete successfully
6. User understands why GPT Image failed (and can try a different prompt)

---

## Note

This is NOT a code bug - OpenAI/GPT models have stricter content moderation than other models like Seedream or FLUX. Some prompts will work on 4 models but fail on GPT Image 1.5 due to safety policies.

