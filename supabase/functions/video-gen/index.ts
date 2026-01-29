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
    const { prompt, model, duration, aspectRatio, audio, images, seed } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Video generation request:', { 
      model, 
      duration, 
      aspectRatio, 
      audio, 
      hasImages: images?.length || 0,
      seed 
    });

    // Build URL with parameters - GET endpoint
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model || 'veo'}`;
    
    // Add duration if provided
    if (duration) {
      url += `&duration=${duration}`;
    }
    
    // Add aspect ratio if provided (16:9 or 9:16)
    if (aspectRatio) {
      url += `&aspectRatio=${encodeURIComponent(aspectRatio)}`;
    }
    
    // Add audio if provided (veo only)
    if (audio && model === 'veo') {
      url += `&audio=true`;
    }
    
    // Add images if provided
    // For veo: image=url1,url2 (first/last frame interpolation)
    // For seedance: image=url1 (single reference image)
    if (images && images.length > 0) {
      const imageUrls = images.join(',');
      url += `&image=${encodeURIComponent(imageUrls)}`;
    }
    
    // Add seed if provided
    if (seed !== undefined && seed !== null && seed !== '') {
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
      
      // Handle specific error codes
      if (response.status === 402) {
        throw new Error('Insufficient pollen balance. Please try a different model or wait.');
      }
      if (response.status === 403) {
        throw new Error('Model access denied. This model may not be available.');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // The response is the actual video binary
    const videoBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(videoBuffer);

    // Convert to base64 in chunks to avoid stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Video = btoa(binary);
    const videoUrl = `data:video/mp4;base64,${base64Video}`;

    console.log('Video generated successfully, size:', videoBuffer.byteLength, 'bytes');

    return new Response(JSON.stringify({ videoUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in video-gen:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
