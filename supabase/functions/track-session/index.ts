import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackSessionRequest {
  anonymousUserId: string;
  sessionId: string;
  userAgent: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { anonymousUserId, sessionId, userAgent }: TrackSessionRequest = await req.json();

    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    console.log('Tracking session:', { anonymousUserId, sessionId, clientIp });

    // Fetch country data from IP geolocation API
    let countryCode = null;
    let countryName = null;

    if (clientIp && clientIp !== 'unknown') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          countryCode = geoData.country_code || null;
          countryName = geoData.country_name || null;
          console.log('Geo data:', { countryCode, countryName });
        }
      } catch (geoError) {
        console.error('Geolocation API error:', geoError);
      }
    }

    // Insert or update session
    const { data, error } = await supabase
      .from('user_sessions')
      .upsert({
        session_id: sessionId,
        anonymous_user_id: anonymousUserId,
        ip_address: clientIp,
        user_agent: userAgent,
        country_code: countryCode,
        country_name: countryName,
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Session tracked successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        countryCode, 
        countryName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
