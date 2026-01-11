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
    const { text, voice, model } = await req.json();
    
    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating TTS with voice:', voice, 'model:', model);

    const encodedText = encodeURIComponent(text);
    // Use new gen.pollinations.ai endpoint with key as query param
    const audioUrl = `https://gen.pollinations.ai/text/${encodedText}?model=${model || 'openai-audio'}&voice=${voice || 'nova'}&key=${apiKey}`;

    const response = await fetch(audioUrl, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations TTS error:', response.status, errorText);
      throw new Error(`TTS Error: ${response.status}`);
    }

    // Return the audio blob
    const audioBlob = await response.blob();
    
    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in pollinations-tts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
