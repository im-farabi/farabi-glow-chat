import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_PASSWORDS = ['ArikAriyan12$', 'OnlyOwner12$'];
const VALID_PET_NAMES = ['Babu', 'b'];

interface DashboardRequest {
  password: string;
  petName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, petName }: DashboardRequest = await req.json();

    // Verify credentials
    if (!VALID_PASSWORDS.includes(password) || !VALID_PET_NAMES.includes(petName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Owner authenticated, fetching dashboard data...');

    // Get active sessions (last activity within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('last_activity', fiveMinutesAgo)
      .order('last_activity', { ascending: false });

    if (sessionsError) throw sessionsError;

    // Get all sessions for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todaySessions, error: todaySessionsError } = await supabase
      .from('user_sessions')
      .select('anonymous_user_id, country_code, country_name')
      .gte('session_start', todayStart.toISOString());

    if (todaySessionsError) throw todaySessionsError;

    // Get recent messages (last 100)
    const { data: recentMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user_sessions!inner(country_code, country_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (messagesError) throw messagesError;

    // Get today's message count
    const { count: todayMessageCount, error: messageCountError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (messageCountError) throw messageCountError;

    // Calculate unique users today
    const uniqueUsersToday = new Set(todaySessions?.map(s => s.anonymous_user_id) || []).size;

    // Calculate country distribution
    const countryStats: Record<string, number> = {};
    todaySessions?.forEach(session => {
      if (session.country_name) {
        countryStats[session.country_name] = (countryStats[session.country_name] || 0) + 1;
      }
    });

    // Calculate average session duration for active sessions
    const sessionDurations = activeSessions?.map(session => {
      const start = new Date(session.session_start).getTime();
      const lastActivity = new Date(session.last_activity).getTime();
      return (lastActivity - start) / 1000 / 60; // minutes
    }) || [];
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    console.log('Dashboard data fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          activeSessions: activeSessions || [],
          recentMessages: recentMessages || [],
          stats: {
            activeUsers: activeSessions?.length || 0,
            uniqueUsersToday,
            todayMessageCount: todayMessageCount || 0,
            todaySessionCount: todaySessions?.length || 0,
            avgSessionDuration: Math.round(avgSessionDuration),
            countryStats,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
