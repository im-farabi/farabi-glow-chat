import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TINYUP_API_KEYS = [
  Deno.env.get('TINYUP_API_KEY_1'),
  Deno.env.get('TINYUP_API_KEY_2'),
  Deno.env.get('TINYUP_API_KEY_3'),
].filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source_url } = await req.json();
    
    if (!source_url) {
      return new Response(
        JSON.stringify({ error: 'source_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Upscaling image:', source_url);

    let lastError: Error | null = null;

    // Try each API key in sequence
    for (let i = 0; i < TINYUP_API_KEYS.length; i++) {
      const apiKey = TINYUP_API_KEYS[i];
      console.log(`Trying API key ${i + 1} of ${TINYUP_API_KEYS.length}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch('https://tinyup.app/api/upscales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ source_url }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          console.error(`API key ${i + 1} failed:`, data);
          lastError = new Error(data.error || data.message || 'Upscale failed');
          continue; // Try next key
        }

        console.log('Successfully upscaled image with API key', i + 1);
        return new Response(
          JSON.stringify({ 
            upscaled_url: data.upscaled_url || data.url || data.result_url,
            data 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error: any) {
        console.error(`Error with API key ${i + 1}:`, error.message);
        lastError = error;
        continue; // Try next key
      }
    }

    // All API keys failed
    throw lastError || new Error('All API keys failed');

  } catch (error: any) {
    console.error('Error in image-upscale function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to upscale image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
