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
    const { anonymousUserId, slug, title, html, css, js } = await req.json();
    
    console.log('Publishing website:', { anonymousUserId, slug, title });

    // Validate required fields
    if (!anonymousUserId || !slug || !title || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has reached the 3 website limit
    const { data: existingWebsites, error: countError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('anonymous_user_id', anonymousUserId);

    if (countError) {
      console.error('Error checking website count:', countError);
      throw countError;
    }

    if (existingWebsites && existingWebsites.length >= 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'You have reached the maximum limit of 3 websites. Delete one to create a new website.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if slug is already taken
    const { data: slugCheck } = await supabase
      .from('user_websites')
      .select('id')
      .eq('slug', slug)
      .single();

    if (slugCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'This slug is already taken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize content (basic sanitization)
    const sanitizedHtml = html.trim();
    const sanitizedCss = css?.trim() || '';
    const sanitizedJs = js?.trim() || '';

    // Insert the website
    const { data: website, error: insertError } = await supabase
      .from('user_websites')
      .insert({
        anonymous_user_id: anonymousUserId,
        slug,
        title,
        html_content: sanitizedHtml,
        css_content: sanitizedCss,
        js_content: sanitizedJs,
        is_published: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting website:', insertError);
      throw insertError;
    }

    const websiteUrl = `${req.headers.get('origin')}/web/${slug}`;

    console.log('Website published successfully:', websiteUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        websiteUrl,
        website 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to publish website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
