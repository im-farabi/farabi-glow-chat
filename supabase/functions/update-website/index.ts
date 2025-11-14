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
    const { anonymousUserId, websiteId, title, html, css, js } = await req.json();
    
    console.log('Updating website:', { anonymousUserId, websiteId, title });

    if (!anonymousUserId || !websiteId || !title || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('user_websites')
      .select('anonymous_user_id, slug')
      .eq('id', websiteId)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ success: false, error: 'Website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing.anonymous_user_id !== anonymousUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the website
    const { data: website, error: updateError } = await supabase
      .from('user_websites')
      .update({
        title: title.trim(),
        html_content: html.trim(),
        css_content: css?.trim() || '',
        js_content: js?.trim() || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating website:', updateError);
      throw updateError;
    }

    const websiteUrl = `${req.headers.get('origin')}/web/${existing.slug}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        websiteUrl,
        website 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
