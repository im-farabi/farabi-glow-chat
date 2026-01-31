import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const APIFREE_BASE = 'https://api.apifree.ai';

// Get all available API keys
function getAllApiKeys(): string[] {
  return [
    Deno.env.get('APIFREE_API_KEY_1'),
    Deno.env.get('APIFREE_API_KEY_2'),
    Deno.env.get('APIFREE_API_KEY_3'),
  ].filter(Boolean) as string[];
}

// Shuffle array for random starting point
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Model-specific payload builder - FIXED per API docs
function buildPayload(model: string, prompt: string, options: Record<string, unknown> = {}) {
  const base = { model, prompt };
  
  switch (model) {
    case 'openai/gpt-image-1.5':
      return {
        ...base,
        size: options.size || '1024x1024',
        quality: options.quality || 'high',
        num_images: 1
      };
      
    case 'google/nano-banana-pro':
      return {
        ...base,
        aspect_ratio: options.aspect_ratio || '1:1',
        resolution: options.resolution || '1K'
      };
      
    case 'black-forest-labs/flux-2-dev':
      return {
        ...base,
        width: 1024,
        height: 1024,
        num_inference_steps: 28,
        num_images: 1
      };
      
    case 'qwen/qwen-image-2512':
      return {
        ...base,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        num_images: 1
      };
      
    case 'tongyi-mai/z-image-turbo':
      return {
        ...base,
        width: 1024,
        height: 1024,
        num_inference_steps: 8,
        num_images: 1
      };
      
    default:
      return base;
  }
}

// Convert ArrayBuffer to base64 (Deno compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateImage(apiKey: string, model: string, prompt: string, options: Record<string, unknown> = {}) {
  const payload = buildPayload(model, prompt, options);
  
  console.log(`[APIFree] Submitting request for model: ${model}`);
  console.log(`[APIFree] Payload:`, JSON.stringify(payload));
  
  // Step 1: Submit request
  const submitRes = await fetch(`${APIFREE_BASE}/v1/image/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const submitData = await submitRes.json();
  console.log(`[APIFree] Submit response:`, JSON.stringify(submitData));
  
  if (submitData.code !== 200) {
    throw new Error(submitData.code_msg || `Submit failed with code ${submitData.code}`);
  }

  const requestId = submitData.resp_data?.request_id;
  if (!requestId) {
    throw new Error('No request_id returned from submit');
  }

  console.log(`[APIFree] Request ID: ${requestId}`);

  // Step 2: Poll for result (max 120 seconds)
  const startTime = Date.now();
  const maxWaitTime = 120000; // 120 seconds
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const resultRes = await fetch(`${APIFREE_BASE}/v1/image/${requestId}/result`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const resultData = await resultRes.json();
    console.log(`[APIFree] Poll response (${Math.round((Date.now() - startTime) / 1000)}s):`, resultData.resp_data?.status);

    if (resultData.code !== 200) {
      console.error(`[APIFree] Poll error:`, resultData);
      throw new Error(resultData.code_msg || 'Failed to get result');
    }

    const status = resultData.resp_data?.status;

    if (status === 'success') {
      const imageList = resultData.resp_data?.image_list;
      if (!imageList || imageList.length === 0) {
        throw new Error('No images in result');
      }
      
      const imageUrl = imageList[0];
      console.log(`[APIFree] Success! Image URL: ${imageUrl.substring(0, 50)}...`);
      
      // Proxy the image: fetch and convert to base64 data URL
      console.log(`[APIFree] Fetching image to proxy...`);
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        console.error(`[APIFree] Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        throw new Error('Failed to fetch generated image for proxying');
      }
      
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const base64 = arrayBufferToBase64(imageArrayBuffer);
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      console.log(`[APIFree] Image proxied successfully (${Math.round(imageArrayBuffer.byteLength / 1024)}KB)`);
      
      return {
        imageUrl: dataUrl, // Return base64 data URL instead of external URL
        usage: resultData.resp_data?.usage
      };
    }

    if (status === 'error' || status === 'failed') {
      const errorMsg = resultData.resp_data?.error || 'Generation failed';
      console.error(`[APIFree] Generation failed:`, errorMsg);
      throw new Error(errorMsg);
    }

    // Continue polling for 'queuing', 'processing', etc.
  }

  throw new Error('Timeout waiting for image generation (120s)');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, prompt, size, quality, aspect_ratio, resolution } = await req.json();

    if (!model) {
      throw new Error('Model is required');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    const keys = shuffle(getAllApiKeys());
    
    if (keys.length === 0) {
      throw new Error('No APIFREE API keys configured');
    }
    
    console.log(`[APIFree] Trying ${keys.length} API keys for model: ${model}`);
    
    let lastError: Error | null = null;
    
    // Try all keys before failing
    for (const apiKey of keys) {
      try {
        const result = await generateImage(apiKey, model, prompt.trim(), {
          size,
          quality,
          aspect_ratio,
          resolution
        });
        
        return new Response(JSON.stringify({
          success: true,
          imageUrl: result.imageUrl,
          usage: result.usage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errMsg = lastError.message.toLowerCase();
        
        // Only retry on rate limit / concurrency errors
        if (errMsg.includes('429') || errMsg.includes('concurrency') || errMsg.includes('rate') || errMsg.includes('exceeded')) {
          console.log(`[APIFree] Key rate limited, trying next key...`);
          continue;
        }
        
        // For other errors, don't retry - throw immediately
        throw lastError;
      }
    }
    
    // All keys exhausted
    console.error(`[APIFree] All ${keys.length} API keys failed`);
    throw lastError || new Error('All API keys failed');

  } catch (error) {
    console.error('[APIFree] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
