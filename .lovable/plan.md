

# Complete Image Generator Overhaul

## Problems Identified

### 1. "Alright Farabi" in Prompt Enhancer

**Root Cause**: The `enhancePrompt` function uses `sendNormal()` which includes the full FARABI persona instructions:
```
You are **FARABI**, an AI Chatbot developed by Google and modified by **Ariyan Farabi**.
Talk friendly with Gen Z vibes...
```

This causes the AI to respond conversationally ("alright farabi, here's the enhanced prompt...") instead of returning ONLY the enhanced prompt.

**Solution**: Create a dedicated, persona-free function for prompt enhancement that passes ONLY the enhancement instructions without any FARABI personality.

---

### 2. Remove Paid Models

**Current models** (need removal):
- `gptimage-large` - PAID via Pollinations

**Replace with 5 new models via APIFree.ai**:

| Model | API ID | Features | Pricing |
|-------|--------|----------|---------|
| GPT Image 1.5 | `openai/gpt-image-1.5` | Best overall quality & reliability | Per image |
| Nano Banana Pro | `google/nano-banana-pro` | 4K HD, text rendering, 14 ref images | Per image |
| FLUX 2 DEV | `black-forest-labs/flux-2-dev` | SOTA realism, fast, open-source | Per image |
| Qwen Image 2512 | `qwen/qwen-image-2512` | Ultra-realistic, open-source, cheapest | Per image |
| Z Image Turbo | `tongyi-mai/z-image-turbo` | Fastest, cost-efficient for volume | Per image |

---

### 3. New API Architecture Required

**APIFree.ai uses async 2-step process:**

```
Step 1: POST /v1/image/submit → returns request_id
Step 2: GET /v1/image/{request_id}/result → poll until status="success"
```

This requires a completely new edge function that handles:
- Submit request with model-specific parameters
- Poll for completion (with timeout)
- Return final image URL

---

## Technical Implementation

### New Files

#### 1. Edge Function: `supabase/functions/apifree-image/index.ts`

New async image generation handler:
- Accepts model, prompt, quality, size/aspect_ratio
- Uses correct API key from secrets
- Submits to APIFree.ai
- Polls until complete (max 120s timeout)
- Returns image URL or error

**Supported Models & Parameters:**

| Model | Parameters |
|-------|------------|
| `openai/gpt-image-1.5` | size: 1024x1024, 1536x1024, 1024x1536 / quality: low, medium, high |
| `google/nano-banana-pro` | aspect_ratio: 1:1, 16:9, etc / resolution: 1K, 2K, 4K |
| `black-forest-labs/flux-2-dev` | aspect_ratio / resolution |
| `qwen/qwen-image-2512` | aspect_ratio / resolution |
| `tongyi-mai/z-image-turbo` | aspect_ratio / resolution |

---

#### 2. Updated Frontend: `src/pages/ImageGen.tsx`

**Model Selection Update:**
```typescript
const MODELS = [
  { id: 'openai/gpt-image-1.5', name: 'GPT Image 1.5', description: 'Best quality', api: 'apifree' },
  { id: 'google/nano-banana-pro', name: 'Nano Banana Pro', description: '4K + text', api: 'apifree' },
  { id: 'black-forest-labs/flux-2-dev', name: 'FLUX 2 DEV', description: 'Fast realism', api: 'apifree' },
  { id: 'qwen/qwen-image-2512', name: 'Qwen Image 2512', description: 'Cheapest', api: 'apifree' },
  { id: 'tongyi-mai/z-image-turbo', name: 'Z Image Turbo', description: 'Fastest', api: 'apifree' },
];
```

**Prompt Enhancement Fix:**
- Create new persona-free call to edge function specifically for enhancement
- OR call the edge function directly without FARABI instructions

---

#### 3. API Key Configuration

**Existing secrets available:**
- `APIFREE_API_KEY_1`
- `APIFREE_API_KEY_2`
- `APIFREE_API_KEY_3`

These will be rotated randomly for load balancing (same pattern as web-gen).

---

## Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/apifree-image/index.ts` | CREATE | New async image gen handler for APIFree.ai |
| `src/pages/ImageGen.tsx` | MODIFY | Update models, fix prompt enhancer, use new edge function |
| `src/lib/api.ts` | MODIFY | Add persona-free `enhancePromptOnly()` function |

---

## Prompt Enhancer Fix (Detailed)

**Current Problem** (line 181-187 in ImageGen.tsx):
```typescript
const enhanced = await sendNormal(
  `${systemPrompt}\n\nOriginal prompt: "${prompt}"\n\nEnhanced prompt:`
);
```

`sendNormal()` wraps the prompt with FARABI persona:
```
FARABI system instructions...
User: [your enhancement request]
Assistant:
```

**Solution - Two Options:**

**Option A (Recommended)**: Call edge function directly for enhancement
```typescript
const { data } = await supabase.functions.invoke('pollinations-chat', {
  body: {
    prompt: `${systemPrompt}\n\nOriginal prompt: "${prompt}"\n\nReturn ONLY the enhanced prompt:`,
    model: 'gemini-search',
    seed: Math.random()
  }
});
const enhanced = data?.text;
```

**Option B**: Create new function in api.ts that skips persona instructions

---

## Edge Function Logic

```typescript
// supabase/functions/apifree-image/index.ts

const APIFREE_BASE = 'https://api.apifree.ai';

async function generateImage(apiKey: string, model: string, prompt: string, options: any) {
  // Step 1: Submit
  const submitRes = await fetch(`${APIFREE_BASE}/v1/image/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      ...options // size, quality, aspect_ratio, resolution, num_images
    })
  });
  
  const submitData = await submitRes.json();
  if (submitData.code !== 200) throw new Error(submitData.code_msg);
  
  const requestId = submitData.resp_data.request_id;
  
  // Step 2: Poll for result (max 120s)
  const startTime = Date.now();
  while (Date.now() - startTime < 120000) {
    await new Promise(r => setTimeout(r, 2000)); // wait 2s between polls
    
    const resultRes = await fetch(`${APIFREE_BASE}/v1/image/${requestId}/result`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const resultData = await resultRes.json();
    
    if (resultData.resp_data.status === 'success') {
      return resultData.resp_data.image_list[0]; // return first image URL
    }
    
    if (resultData.resp_data.status === 'error' || resultData.resp_data.status === 'failed') {
      throw new Error(resultData.resp_data.error || 'Generation failed');
    }
  }
  
  throw new Error('Timeout waiting for image');
}
```

---

## Model-Specific Parameters

| Model | Submit Body |
|-------|-------------|
| `openai/gpt-image-1.5` | `{ model, prompt, size: "1024x1024", quality: "high", num_images: 1 }` |
| `google/nano-banana-pro` | `{ model, prompt, aspect_ratio: "1:1", resolution: "1K" }` |
| `black-forest-labs/flux-2-dev` | `{ model, prompt, aspect_ratio: "1:1" }` |
| `qwen/qwen-image-2512` | `{ model, prompt, aspect_ratio: "1:1" }` |
| `tongyi-mai/z-image-turbo` | `{ model, prompt, aspect_ratio: "1:1" }` |

---

## UI Updates

- Header: "5 Models" instead of "4 Models"
- Model names updated with new descriptions
- Loading states improved for async polling (show "Queued...", "Processing...", etc.)

---

## Result After Implementation

- No FARABI persona in prompt enhancement
- 5 premium image models via APIFree.ai
- No paid Pollinations models
- Proper async handling with polling
- API key rotation for reliability

