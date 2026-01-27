

# Giyaat Edge Function Proxy & Error Handling Plan

## Overview

Create a Supabase Edge Function to proxy Giyaat API requests, bypassing the CORS restriction that's causing `Failed to fetch` errors. Also add comprehensive error handling with user-friendly toast notifications.

---

## Problem Analysis

**Current Issue**: The browser blocks direct requests to `giyaaat.vercel.app` due to CORS (Cross-Origin Resource Sharing) policy. The API server doesn't return the necessary `Access-Control-Allow-Origin` headers.

**Solution**: Route requests through a Supabase Edge Function, which executes server-side and is not subject to browser CORS restrictions.

---

## Files to Create

### 1. `supabase/functions/giyaat-proxy/index.ts`

New edge function to proxy requests to the Giyaat API.

**Implementation:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();
    
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }
    
    const validModels = ['fast', 'mid', 'large'];
    const selectedModel = validModels.includes(model) ? model : 'fast';
    
    console.log('Giyaat proxy request:', { model: selectedModel, promptLength: prompt.length });
    
    // Build Giyaat API URL
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://giyaaat.vercel.app/${encodedPrompt}?model=${selectedModel}`;
    
    // Timeout handling (45 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Giyaat API error: ${response.status}`);
    }
    
    const text = await response.text();
    
    return new Response(JSON.stringify({ text }), {
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
      } else if (error.message.includes('fetch')) {
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

## Files to Modify

### 1. `supabase/config.toml`

Add the new edge function configuration with `verify_jwt = false`.

**Addition:**
```toml
[functions.giyaat-proxy]
verify_jwt = false
```

---

### 2. `src/lib/api.ts`

Update `sendGiyaat()` to call the edge function instead of direct API.

**Changes:**
- Replace direct fetch to `giyaaat.vercel.app` with `supabase.functions.invoke('giyaat-proxy')`
- Add structured error handling with error codes
- Return clear error messages for different failure scenarios

**Updated Function:**
```typescript
export async function sendGiyaat(
  prompt: string,
  model: 'fast' | 'mid' | 'large' = 'fast'
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('giyaat-proxy', {
      body: { prompt, model }
    });
    
    if (error) {
      console.error('Giyaat edge function error:', error);
      throw new Error(error.message || 'Failed to connect to GIYAAT');
    }
    
    if (data?.error) {
      console.error('Giyaat API error:', data.error, data.code);
      throw new Error(data.error);
    }
    
    if (!data?.text) {
      throw new Error('Empty response from GIYAAT');
    }
    
    return data.text;
  } catch (error) {
    console.error('sendGiyaat error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred with GIYAAT');
  }
}
```

---

### 3. `src/pages/Index.tsx`

Add specific error handling for Giyaat modes with user-friendly toast messages.

**Changes in the `catch` block (around line 490-510):**
- Detect Giyaat-specific errors
- Show targeted error messages based on error type
- Provide helpful suggestions in toast

**Updated Error Handling:**
```typescript
} catch (error) {
  console.error('Error sending message:', error);
  
  // Specific error messages based on mode
  let errorTitle = 'Failed to send message';
  let errorDescription = 'An error occurred. Please try again later.';
  
  if (mode.startsWith('giyaat')) {
    errorTitle = 'GIYAAT Error';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorDescription = 'GIYAAT is taking too long to respond. Try a shorter prompt or different mode.';
      } else if (error.message.includes('connection') || error.message.includes('reach')) {
        errorDescription = 'Could not reach GIYAAT server. The service may be temporarily unavailable.';
      } else {
        errorDescription = error.message;
      }
    }
  } else {
    errorDescription = `Possible reasons:
1. Server / API is Down
2. Prompt is Inappropriate
Check other services and try again later.`;
  }
  
  toast.error(errorTitle, {
    description: errorDescription,
    duration: 6000,
  });
  
  // Remove loading message on error
  setMessages(newMessages);
}
```

---

## Implementation Order

1. **Create `supabase/functions/giyaat-proxy/index.ts`**
   - Edge function with CORS headers
   - Proxy logic to Giyaat API
   - Timeout and error handling
   - Structured error responses with codes

2. **Update `supabase/config.toml`**
   - Add `giyaat-proxy` function config

3. **Update `src/lib/api.ts`**
   - Replace direct fetch with `supabase.functions.invoke`
   - Add structured error handling

4. **Update `src/pages/Index.tsx`**
   - Add Giyaat-specific error detection
   - Show user-friendly toast messages

---

## Error Handling Matrix

| Error Type | Toast Title | Toast Message |
|------------|-------------|---------------|
| Timeout | GIYAAT Error | GIYAAT is taking too long. Try a shorter prompt or different mode. |
| Connection | GIYAAT Error | Could not reach GIYAAT server. Service may be temporarily unavailable. |
| API Error | GIYAAT Error | [Specific error message from API] |
| Empty Response | GIYAAT Error | Empty response from GIYAAT. Please try again. |

---

## Testing Plan

After implementation:
1. Test each Giyaat mode (Fast, Mid, Large) with a simple prompt
2. Verify error handling by testing with very long prompts
3. Check edge function logs for proper logging
4. Confirm toast messages appear correctly on errors

