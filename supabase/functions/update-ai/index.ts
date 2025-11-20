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
    const { aiId, anonymousUserId, name, shortDescription, fullInstructions } = await req.json();

    if (!aiId || !anonymousUserId || !name || !shortDescription || !fullInstructions) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (name.length < 3 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 3 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shortDescription.length < 10 || shortDescription.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Short description must be between 10 and 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fullInstructions.length < 20 || fullInstructions.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Full instructions must be between 20 and 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ai, error: fetchError } = await supabase
      .from('custom_ais')
      .select('*')
      .eq('id', aiId)
      .eq('anonymous_user_id', anonymousUserId)
      .single();

    if (fetchError || !ai) {
      return new Response(
        JSON.stringify({ error: 'AI not found or you do not have permission to edit it' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: updatedAI, error: updateError } = await supabase
      .from('custom_ais')
      .update({
        name,
        short_description: shortDescription,
        full_instructions: fullInstructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', aiId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ai: updatedAI }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
