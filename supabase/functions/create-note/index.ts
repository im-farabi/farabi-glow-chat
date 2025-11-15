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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { title, shortDescription, description, password, colorTheme, anonymousUserId, slug } = await req.json();

    console.log('Creating note with slug:', slug);

    // Validate required fields
    if (!title || title.length < 3 || title.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Title must be between 3 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!description || description.length < 20 || description.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Description must be between 20 and 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shortDescription && (shortDescription.length < 10 || shortDescription.length > 200)) {
      return new Response(
        JSON.stringify({ error: 'Short description must be between 10 and 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!slug || slug.length < 3 || slug.length > 50 || !/^[a-z0-9-]+$/.test(slug)) {
      return new Response(
        JSON.stringify({ error: 'Slug must be 3-50 characters, lowercase alphanumeric and hyphens only' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if slug already exists using count
    const { count, error: countError } = await supabase
      .from('shared_notes')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug);

    if (countError) {
      console.error('Error checking slug:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify slug availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: 'This slug is already taken. Please choose another.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Password protection removed - always store null
    const hashedPassword = null;

    // Insert note
    const { data: note, error } = await supabase
      .from('shared_notes')
      .insert({
        slug,
        title,
        short_description: shortDescription || null,
        description,
        password: hashedPassword,
        color_theme: colorTheme || 'black-purple',
        anonymous_user_id: anonymousUserId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Note created successfully:', note.id);

    return new Response(
      JSON.stringify({ success: true, note, url: `/notes/${slug}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-note function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});