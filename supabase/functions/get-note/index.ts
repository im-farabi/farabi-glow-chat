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

    const { slug, password } = await req.json();

    console.log('Fetching note with slug:', slug);

    // Fetch note
    const { data: note, error } = await supabase
      .from('shared_notes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !note) {
      console.error('Note not found:', error);
      return new Response(
        JSON.stringify({ error: 'Note not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check password if protected
    if (note.password) {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password required', passwordRequired: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash provided password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashedPassword !== note.password) {
        return new Response(
          JSON.stringify({ error: 'Incorrect password', passwordRequired: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Increment view count
    await supabase
      .from('shared_notes')
      .update({ views_count: note.views_count + 1 })
      .eq('id', note.id);

    // Remove password from response
    const { password: _, ...noteData } = note;

    console.log('Note fetched successfully:', note.id);

    return new Response(
      JSON.stringify({ success: true, note: noteData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-note function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});