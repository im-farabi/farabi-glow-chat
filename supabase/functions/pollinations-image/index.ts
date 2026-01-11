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
    const { prompt } = await req.json();
    
    if (!prompt) {
      throw new Error('No prompt provided');
    }

    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating image for prompt:', prompt);

    const encodedPrompt = encodeURIComponent(prompt);
    // Use new gen.pollinations.ai endpoint with key as query param
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?nologo=true&key=${apiKey}`;

    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error('Pollinations Image error:', response.status);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    // Return the image blob
    const imageBlob = await response.blob();
    
    return new Response(imageBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('Error in pollinations-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
