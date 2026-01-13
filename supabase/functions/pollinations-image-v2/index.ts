import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, width, height, seed } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating image with gptimage, width:', width, 'height:', height, 'seed:', seed);

    // Build URL with parameters - GET endpoint
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=gptimage`;
    
    // Add size parameters
    if (width) {
      url += `&width=${width}`;
    }
    if (height) {
      url += `&height=${height}`;
    }
    
    // Add seed if provided
    if (seed !== undefined && seed !== null) {
      url += `&seed=${Math.floor(Number(seed))}`;
    }
    
    // Add API key
    url += `&key=${apiKey}`;
    
    // Add nologo and nofeed for cleaner output
    url += `&nologo=true&nofeed=true`;

    console.log('Fetching image from URL (without key):', url.replace(apiKey, '***'));

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations Image API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // The response is the actual image binary
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('Image generated successfully, size:', imageBuffer.byteLength, 'bytes');

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in pollinations-image-v2:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
