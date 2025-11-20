import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const aiId = pathParts[pathParts.length - 2];
    const prompt = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!aiId || !prompt) {
      return new Response('AI ID and prompt are required', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ai, error: aiError } = await supabase
      .from('custom_ais')
      .select('*')
      .eq('random_id', aiId)
      .eq('is_published', true)
      .single();

    if (aiError || !ai) {
      return new Response('AI not found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    const pollinationsKey = Deno.env.get('POLLINATIONS_API_KEY');
    if (!pollinationsKey) {
      return new Response('AI service temporarily unavailable', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    const aiResponse = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pollinationsKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: ai.full_instructions },
          { role: 'user', content: prompt }
        ],
        model: 'google/gemini-2.5-flash',
      }),
    });

    if (!aiResponse.ok) {
      console.error('Pollinations API error:', aiResponse.status);
      return new Response('Failed to generate response', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || 'No response generated';

    await supabase
      .from('custom_ais')
      .update({ views_count: (ai.views_count || 0) + 1 })
      .eq('id', ai.id);

    await supabase
      .from('ai_usages')
      .insert({
        ai_id: ai.id,
        prompt,
        response_length: generatedText.length,
      });

    return new Response(generatedText, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error in ai-endpoint function:', error);
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
    );
  }
});
