import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, slug, html_content, anonymous_id } = await req.json();

    console.log('[publish-website] Request:', { title, slug, contentLength: html_content?.length });

    // Validate required fields
    if (!title || !slug || !html_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, slug, and html_content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate slug format (alphanumeric and hyphens, 3-50 chars)
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    if (!slugRegex.test(slug)) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug format. Use 3-50 lowercase letters, numbers, or hyphens.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if slug already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('slug', slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[publish-website] Check error:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check slug availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'This URL is already taken. Try a different name.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the website
    const { data, error: insertError } = await supabase
      .from('user_websites')
      .insert({
        title,
        slug,
        html_content,
        anonymous_user_id: anonymous_id || 'anonymous',
        is_published: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('[publish-website] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to publish website' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[publish-website] Published successfully:', data.id);

    // Build the URL - clean, simple pattern
    const publishedUrl = `https://farabi.me/site/${slug}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        id: data.id,
        url: publishedUrl,
        slug
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[publish-website] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
