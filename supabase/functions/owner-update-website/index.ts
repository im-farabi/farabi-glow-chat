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
    const { password, petName, websiteId, title, html, css, js, is_published } = await req.json();

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

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (html !== undefined) updates.html_content = html;
    if (css !== undefined) updates.css_content = css;
    if (js !== undefined) updates.js_content = js;
    if (is_published !== undefined) updates.is_published = is_published;

    const { data: website, error: updateError } = await supabase
      .from('user_websites')
      .update(updates)
      .eq('id', websiteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating website:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, website }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in owner-update-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
