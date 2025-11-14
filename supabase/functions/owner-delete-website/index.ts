import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, petName, websiteId } = await req.json();

    // Verify owner credentials
    const OWNER_PASSWORD = Deno.env.get('OWNER_PASSWORD');
    const OWNER_PET_NAME = Deno.env.get('OWNER_PET_NAME');

    if (password !== OWNER_PASSWORD || petName !== OWNER_PET_NAME) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!websiteId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing websiteId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete the website
    const { error: deleteError } = await supabase
      .from('user_websites')
      .delete()
      .eq('id', websiteId);

    if (deleteError) {
      console.error('Error deleting website:', deleteError);
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in owner-delete-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
