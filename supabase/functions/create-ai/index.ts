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
    const { name, shortDescription, fullInstructions, anonymousUserId } = await req.json();

    // Validation
    if (!name || name.length < 3 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 3 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shortDescription || shortDescription.length < 10 || shortDescription.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Short description must be between 10 and 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fullInstructions || fullInstructions.length < 20 || fullInstructions.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Full instructions must be between 20 and 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!anonymousUserId) {
      return new Response(
        JSON.stringify({ error: 'Anonymous user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate unique random_id (8 characters alphanumeric)
    let randomId = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      randomId = generateRandomId(8);
      
      const { data: existing } = await supabase
        .from('custom_ais')
        .select('id')
        .eq('random_id', randomId)
        .single();

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique ID. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the AI
    const { data: ai, error } = await supabase
      .from('custom_ais')
      .insert({
        random_id: randomId,
        name: name.trim(),
        short_description: shortDescription.trim(),
        full_instructions: fullInstructions.trim(),
        anonymous_user_id: anonymousUserId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://farabi.me/ai/${randomId}/prompt/YOUR_PROMPT_HERE`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        ai,
        url 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRandomId(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
