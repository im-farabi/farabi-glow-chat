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

    const { anonymousUserId } = await req.json();

    console.log('Fetching dashboard for user:', anonymousUserId);

    // Fetch up to 10 most recent notes
    const { data: notes, error: notesError } = await supabase
      .from('shared_notes')
      .select('id, slug, title, short_description, color_theme, created_at, views_count')
      .eq('anonymous_user_id', anonymousUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!notes || notes.length === 0) {
      return new Response(
        JSON.stringify({ notes: [], totalNotes: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch device breakdown for all notes
    const noteIds = notes.map(n => n.id);
    const { data: views, error: viewsError } = await supabase
      .from('note_views')
      .select('note_id, device_type')
      .in('note_id', noteIds);

    if (viewsError) {
      console.error('Error fetching views:', viewsError);
      // Continue without device breakdown if views table fails
    }

    // Aggregate device breakdown per note
    const notesWithDevices = notes.map(note => {
      const noteViews = views?.filter(v => v.note_id === note.id) || [];
      const devices = {
        mobile: noteViews.filter(v => v.device_type === 'mobile').length,
        desktop: noteViews.filter(v => v.device_type === 'desktop').length,
        ios: noteViews.filter(v => v.device_type === 'ios').length,
        unknown: noteViews.filter(v => v.device_type === 'unknown').length,
      };

      return {
        ...note,
        devices,
      };
    });

    console.log('Dashboard fetched successfully:', notesWithDevices.length, 'notes');

    return new Response(
      JSON.stringify({ 
        notes: notesWithDevices, 
        totalNotes: notesWithDevices.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notes-dashboard function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
