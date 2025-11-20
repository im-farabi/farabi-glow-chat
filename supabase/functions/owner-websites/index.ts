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
    const { password, petName } = await req.json();

    // Authentication check
    const validPasswords = ['ArikAriyan12$', 'OnlyOwner12$'];
    const validPetNames = ['Babu', 'b'];

    if (!validPasswords.includes(password) || !validPetNames.includes(petName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user websites
    const { data: websites, error: websitesError } = await supabase
      .from('user_websites')
      .select('id, anonymous_user_id, slug, title, views_count, created_at, is_published')
      .order('created_at', { ascending: false });

    if (websitesError) {
      console.error('Error fetching websites:', websitesError);
      throw websitesError;
    }

    // Fetch shared notes
    const { data: sharedNotes, error: notesError } = await supabase
      .from('shared_notes')
      .select('id, anonymous_user_id, slug, title, views_count, created_at')
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching shared notes:', notesError);
      throw notesError;
    }

    return new Response(
      JSON.stringify({
        websites: websites || [],
        sharedNotes: sharedNotes || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in owner-websites function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
