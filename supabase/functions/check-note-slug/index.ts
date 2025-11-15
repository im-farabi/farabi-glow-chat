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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { slug } = await req.json();

    console.log('Checking slug availability:', slug);

    // Validate slug format
    if (!slug || slug.length < 3 || slug.length > 50 || !/^[a-z0-9-]+$/.test(slug)) {
      return new Response(
        JSON.stringify({ available: false, error: 'Invalid slug format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if slug exists
    const { data, error } = await supabase
      .from('shared_notes')
      .select('id')
      .eq('slug', slug)
      .single();

    const available = !data && !error;

    console.log('Slug availability:', available);

    return new Response(
      JSON.stringify({ available }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-note-slug function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});