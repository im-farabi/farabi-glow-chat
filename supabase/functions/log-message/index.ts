import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogMessageRequest {
  anonymousUserId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  hasImage?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { anonymousUserId, sessionId, role, content, mode, hasImage }: LogMessageRequest = await req.json();

    console.log('Logging message:', { anonymousUserId, sessionId, role, contentLength: content.length });

    // Insert message
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        anonymous_user_id: anonymousUserId,
        session_id: sessionId,
        role,
        content,
        mode,
        has_image: hasImage || false,
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Message logged successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error logging message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
