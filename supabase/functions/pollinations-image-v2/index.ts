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
    const { prompt, size, seed } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating image with gptimage-large, size:', size, 'seed:', seed);

    const payload: Record<string, unknown> = {
      model: "gptimage-large",
      prompt: prompt,
      size: size || "1024x1024",
    };
    
    if (seed !== undefined && seed !== null) {
      payload.seed = Math.floor(Number(seed));
    }

    const response = await fetch('https://gen.pollinations.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations Image API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Image generation response:', JSON.stringify(data).substring(0, 200));

    // Response format: { data: [{ url: "...", b64_json: "..." }] }
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

    return new Response(JSON.stringify({ imageUrl, data }), {
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
