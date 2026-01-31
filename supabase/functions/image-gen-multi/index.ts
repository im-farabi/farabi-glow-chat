import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenRequest {
  prompt: string;
  model: string;
  seed?: number;
  imageUrl?: string;
  width?: number;
  height?: number;
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

    // Generate safe seed within 32-bit integer range
    const safeSeed = seed ? Math.floor(seed % 1000000) : Math.floor(Math.random() * 1000000);

    console.log(`[ImageGenMulti] Generating with model: ${model}, prompt: ${prompt.substring(0, 50)}..., seed: ${safeSeed}`);

    // Build the Pollinations API URL
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&width=${width}&height=${height}&seed=${safeSeed}&nologo=true&key=${apiKey}`;
    
    // Add reference image if provided
    if (imageUrl) {
      url += `&image=${encodeURIComponent(imageUrl)}`;
    }

    console.log(`[ImageGenMulti] Calling Pollinations API...`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ImageGenMulti] Pollinations error: ${response.status} - ${errorText}`);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    // Get the image as blob and convert to base64
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, [...chunk]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    console.log(`[ImageGenMulti] Successfully generated image, size: ${base64.length} chars`);

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: dataUrl,
      seed: safeSeed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
