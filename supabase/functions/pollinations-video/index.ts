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
    const { prompt, duration, resolution, seed } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating video with veo-3.1-fast, duration:', duration, 'resolution:', resolution, 'seed:', seed);

    const payload: Record<string, unknown> = {
      model: "veo-3.1-fast",
      prompt: prompt,
      duration: duration || 6,
      resolution: resolution || "512x512",
    };
    
    if (seed !== undefined && seed !== null) {
      payload.seed = Math.floor(Number(seed));
    }

    const response = await fetch('https://gen.pollinations.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations Video API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Video generation response:', JSON.stringify(data).substring(0, 200));

    // Response format: { data: [{ url: "..." }] }
    const videoUrl = data.data?.[0]?.url;

    return new Response(JSON.stringify({ videoUrl, data }), {
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
