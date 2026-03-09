import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImageGenRequest {
  prompt: string;
  model: string;
  seed?: number;
  imageUrl?: string;
  width?: number;
  height?: number;
}

// Fallback model order if primary model fails
const MODEL_FALLBACKS: Record<string, string[]> = {
  'imagen-4': ['gptimage', 'flux', 'seedream'],
  'gptimage': ['flux', 'imagen-4', 'seedream'],
  'flux': ['gptimage', 'imagen-4', 'seedream'],
};

async function tryGenerateImage(
  prompt: string,
  model: string, 
  width: number, 
  height: number, 
  seed: number, 
  apiKey: string,
  imageUrl?: string
): Promise<{ success: boolean; imageBlob?: Blob; error?: string }> {
  const encodedPrompt = encodeURIComponent(prompt);
  let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true&key=${apiKey}`;
  
  if (imageUrl) {
    url += `&image=${encodeURIComponent(imageUrl)}`;
  }

  console.log(`[ImageGenMulti] Trying model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout per attempt

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ImageGenMulti] ${model} error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { success: false, error: `${model}: ${response.status}` };
    }

    const imageBlob = await response.blob();
    if (imageBlob.size < 1000) {
      console.error(`[ImageGenMulti] ${model} returned tiny image (${imageBlob.size} bytes)`);
      return { success: false, error: `${model}: invalid image` };
    }

    return { success: true, imageBlob };
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[ImageGenMulti] ${model} exception: ${msg}`);
    return { success: false, error: `${model}: ${msg}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, seed, imageUrl, width = 1024, height = 1024 }: ImageGenRequest = await req.json();
    
    if (!prompt) {
      throw new Error('No prompt provided');
    }

    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const safeSeed = seed ? Math.floor(seed % 1000000) : Math.floor(Math.random() * 1000000);
    console.log(`[ImageGenMulti] Request: model=${model}, prompt=${prompt.substring(0, 50)}..., seed=${safeSeed}`);

    // Build model attempts list: primary + fallbacks
    const modelsToTry = [model, ...(MODEL_FALLBACKS[model] || ['gptimage', 'flux'])];
    
    let lastError = '';
    for (const tryModel of modelsToTry) {
      const result = await tryGenerateImage(prompt, tryModel, width, height, safeSeed, apiKey, imageUrl);
      
      if (result.success && result.imageBlob) {
        // Convert to base64
        const arrayBuffer = await result.imageBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, [...chunk]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log(`[ImageGenMulti] Success with ${tryModel}, size: ${base64.length} chars`);

        return new Response(JSON.stringify({ 
          success: true,
          imageUrl: dataUrl,
          seed: safeSeed,
          modelUsed: tryModel
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      lastError = result.error || 'Unknown error';
      console.log(`[ImageGenMulti] ${tryModel} failed, trying next...`);
    }

    // All models failed
    throw new Error(`All models failed. Last: ${lastError}`);

  } catch (error) {
    console.error('[ImageGenMulti] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
