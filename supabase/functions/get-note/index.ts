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

    // Parse User-Agent and determine device type
    const userAgent = req.headers.get('user-agent') || '';
    let deviceType = 'unknown';
    
    if (/iPhone|iPad|iPod|iOS/i.test(userAgent)) {
      deviceType = 'ios';
    } else if (/Android|Mobi/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Windows|Macintosh|Linux/i.test(userAgent)) {
      deviceType = 'desktop';
    }

    // Log view with device type
    await supabase
      .from('note_views')
      .insert({
        note_id: note.id,
        user_agent: userAgent,
        device_type: deviceType,
      });

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