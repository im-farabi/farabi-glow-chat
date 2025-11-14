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
    const { anonymousUserId } = await req.json();
    
    console.log('Fetching websites for user:', anonymousUserId);

    if (!anonymousUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Anonymous user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: websites, error } = await supabase
      .from('user_websites')
      .select('id, slug, title, views_count, created_at, is_published')
      .eq('anonymous_user_id', anonymousUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        websites: websites || [],
        count: websites?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-user-websites:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch websites' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
