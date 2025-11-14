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
    const { password, petName } = await req.json();

    // Verify owner credentials
    const OWNER_PASSWORD = Deno.env.get('OWNER_PASSWORD');
    const OWNER_PET_NAME = Deno.env.get('OWNER_PET_NAME');

    if (password !== OWNER_PASSWORD || petName !== OWNER_PET_NAME) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all websites with user info
    const { data: websites, error } = await supabase
      .from('user_websites')
      .select('*')
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
    console.error('Error in owner-websites:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch websites' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
