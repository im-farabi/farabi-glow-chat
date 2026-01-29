import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VEO_SYSTEM_PROMPT = `You are an expert video prompt engineer for Google Veo 3.1. Transform basic prompts into cinematic video descriptions using this formula:

[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]

Include:
- Camera work: dolly, tracking, crane, POV, close-up, wide shot, shallow depth of field
- Subject details: appearance, clothing, expression
- Motion: specific actions and movements
- Environment: setting, lighting, atmosphere
- Style: cinematic, film grain, color grading, mood
{audioNote}
{imageNote}

Keep response under 200 words. Output ONLY the enhanced prompt, no explanations or introductions.`;

const SEEDANCE_SYSTEM_PROMPT = `You are an expert video prompt engineer for Seedance AI. Transform basic prompts into dynamic video descriptions using this formula:

Subject + Motion + Scene + Shot/Style

Include:
- Subject with distinctive features
- Motion with intensity adverbs: rapidly, powerfully, wildly, gently
- Camera movements: surround, aerial, zoom, pan, follow, handheld
- Scene environment
- Keep it direct and concise - Seedance works better with simpler prompts
{imageNote}

Keep response under 150 words. Output ONLY the enhanced prompt, no explanations or introductions.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model, hasAudio, hasImages } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      console.error('Missing NEW_POLLINATIONS_APIKEY_1');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt based on model
    let systemPrompt: string;
    
    if (model === 'veo') {
      const audioNote = hasAudio 
        ? '- Since audio is enabled: Add dialogue in quotes, use "SFX:" for sound effects, describe ambient sounds' 
        : '';
      const imageNote = hasImages 
        ? '- Since reference images are provided: Reference "starting from the first frame" or "transitioning between frames"' 
        : '';
      
      systemPrompt = VEO_SYSTEM_PROMPT
        .replace('{audioNote}', audioNote)
        .replace('{imageNote}', imageNote);
    } else {
      // seedance or seedance-pro
      const imageNote = hasImages 
        ? '- Since a reference image is provided: Focus on describing the motion and camera work, as the scene is already defined by the image' 
        : '';
      
      systemPrompt = SEEDANCE_SYSTEM_PROMPT.replace('{imageNote}', imageNote);
    }

    console.log(`Enhancing prompt for model: ${model}, hasAudio: ${hasAudio}, hasImages: ${hasImages}`);
    console.log(`Original prompt: ${prompt}`);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Transform this basic prompt into an optimized video prompt: "${prompt}"` }
    ];

    // Try openai first
    console.log('Trying openai model...');
    let response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.7,
      }),
    });

    // Fallback to grok if openai fails
    if (!response.ok) {
      const errorText = await response.text();
      console.error('openai failed:', response.status, errorText);
      console.log('Trying grok fallback...');
      
      response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok',
          messages,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const grokError = await response.text();
        console.error('grok also failed:', response.status, grokError);
        return new Response(
          JSON.stringify({ error: 'Failed to enhance prompt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('grok fallback succeeded');
    } else {
      console.log('openai succeeded');
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      console.error('No enhanced prompt in response:', data);
      return new Response(
        JSON.stringify({ error: 'No enhanced prompt generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    return new Response(
      JSON.stringify({ enhancedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
