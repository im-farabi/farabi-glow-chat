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
      : Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Generating with model:', model, 'seed:', seed, 'has image:', !!image, 'useFallback:', useFallback);

    // Build messages in OpenAI format
    let messageContent;
    
    if (image) {
      // For images: use array format with text + image_url
      messageContent = [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { url: `data:image/jpeg;base64,${image}` } 
        }
      ];
      console.log('Vision mode enabled - sending image with prompt');
    } else {
      // For text-only: simple string
      messageContent = prompt;
    }

    const payload = {
      model: model,
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      seed: seed
    };

    // Use OpenAI-compatible endpoint (new gen.pollinations.ai)
    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

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
