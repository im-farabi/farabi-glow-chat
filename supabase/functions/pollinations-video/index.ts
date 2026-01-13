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
    const { prompt, duration, aspectRatio, seed } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating video with veo, duration:', duration, 'aspectRatio:', aspectRatio, 'seed:', seed);

    // Build URL with parameters - GET endpoint (same as image but with model=veo)
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=veo`;
    
    // Add duration if provided (4, 6, or 8 seconds)
    if (duration) {
      url += `&duration=${duration}`;
    }
    
    // Add aspect ratio if provided (16:9 or 9:16)
    if (aspectRatio) {
      url += `&aspectRatio=${encodeURIComponent(aspectRatio)}`;
    }
    
    // Add seed if provided
    if (seed !== undefined && seed !== null) {
      url += `&seed=${Math.floor(Number(seed))}`;
    }
    
    // Add API key
    url += `&key=${apiKey}`;
    
    // Add nologo and nofeed for cleaner output
    url += `&nologo=true&nofeed=true`;

    console.log('Fetching video from URL (without key):', url.replace(apiKey, '***'));

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations Video API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // The response is the actual video binary
    const videoBuffer = await response.arrayBuffer();
    const base64Video = btoa(String.fromCharCode(...new Uint8Array(videoBuffer)));
    const videoUrl = `data:video/mp4;base64,${base64Video}`;

    console.log('Video generated successfully, size:', videoBuffer.byteLength, 'bytes');

    return new Response(JSON.stringify({ videoUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in pollinations-video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
