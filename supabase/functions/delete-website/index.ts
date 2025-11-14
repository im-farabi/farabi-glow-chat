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
    const { anonymousUserId, websiteId } = await req.json();
    
    console.log('Deleting website:', { anonymousUserId, websiteId });

    if (!anonymousUserId || !websiteId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify ownership before deleting
    const { data: website, error: fetchError } = await supabase
      .from('user_websites')
      .select('anonymous_user_id')
      .eq('id', websiteId)
      .single();

    if (fetchError || !website) {
      return new Response(
        JSON.stringify({ success: false, error: 'Website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (website.anonymous_user_id !== anonymousUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    console.error('Error in delete-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
