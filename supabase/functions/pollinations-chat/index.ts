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
    const { prompt, model, seed, image, useFallback } = await req.json();
    
    const apiKey = useFallback 
      ? Deno.env.get('POLLINATIONS_FALLBACK_API_KEY')
      : Deno.env.get('POLLINATIONS_API_KEY');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating with model:', model, 'seed:', seed, 'useFallback:', useFallback);

    let response: Response;

    if (image) {
      // POST request with FormData for images
      const formData = new FormData();
      formData.append('model', model);
      formData.append('image', image);
      formData.append('prompt', prompt);
      
      response = await fetch('https://text.pollinations.ai/api/generate', {
        method: 'POST',
        body: formData
      });
    } else {
      // GET request with prompt in URL for text-only
      const textUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${seed}`;
      response = await fetch(textUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const text = await response.text();

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in pollinations-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
