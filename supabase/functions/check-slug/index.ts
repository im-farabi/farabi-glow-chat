import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESERVED_SLUGS = [
  'admin', 'api', 'auth', 'dashboard', 'owner', 'settings', 
  'login', 'signup', 'logout', 'app', 'www', 'mail', 'ftp',
  'web', 'new', 'create', 'edit', 'delete', 'update'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();
    
    console.log('Checking slug availability:', slug);

    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return new Response(
        JSON.stringify({ available: false, message: 'Slug is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check length
    if (slug.length < 3 || slug.length > 50) {
      return new Response(
        JSON.stringify({ available: false, message: 'Slug must be 3-50 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return new Response(
        JSON.stringify({ available: false, message: 'Only lowercase letters, numbers, and hyphens allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.includes(slug)) {
      return new Response(
        JSON.stringify({ available: false, message: 'This slug is reserved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check database availability
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('user_websites')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      throw error;
    }

    if (data) {
      return new Response(
        JSON.stringify({ available: false, message: 'This slug is already taken' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ available: true, message: 'Slug is available!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-slug:', error);
    return new Response(
      JSON.stringify({ available: false, message: 'Error checking slug availability' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
