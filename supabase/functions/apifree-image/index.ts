import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const APIFREE_BASE = 'https://api.apifree.ai';

// Get a random API key from the 3 available
function getRandomApiKey(): string {
  const keys = [
    Deno.env.get('APIFREE_API_KEY_1'),
    Deno.env.get('APIFREE_API_KEY_2'),
    Deno.env.get('APIFREE_API_KEY_3'),
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) {
    throw new Error('No APIFREE API keys configured');
  }
  
  return keys[Math.floor(Math.random() * keys.length)];
}

// Model-specific payload builder
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
    case 'qwen/qwen-image-2512':
    case 'tongyi-mai/z-image-turbo':
      return {
        ...base,
        aspect_ratio: options.aspect_ratio || '1:1'
      };
    default:
      return base;
  }
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
      console.log(`[APIFree] Success! Image URL: ${imageList[0].substring(0, 50)}...`);
      return {
        imageUrl: imageList[0],
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

    const apiKey = getRandomApiKey();
    
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
