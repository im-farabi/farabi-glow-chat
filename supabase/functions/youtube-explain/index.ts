import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video title from YouTube
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) {
      return 'Unknown Title';
    }
    const data = await response.json();
    return data.title || 'Unknown Title';
  } catch (error) {
    console.error('Error fetching title:', error);
    return 'Unknown Title';
  }
}

// Fetch transcript using YouTube's timedtext API
async function fetchTranscript(videoId: string): Promise<{ text: string; title: string }> {
  try {
    // First get the video page to extract caption tracks
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await pageResponse.text();
    
    // Extract caption tracks from player response
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
    if (!playerResponseMatch) {
      throw new Error('Could not find player response');
    }
    
    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    // Find English caption track or use first available
    let captionTrack = captionTracks.find((track: any) => 
      track.languageCode === 'en' || track.languageCode.startsWith('en')
    ) || captionTracks[0];
    
    // Fetch the caption XML
    const captionUrl = captionTrack.baseUrl;
    const captionResponse = await fetch(captionUrl);
    const captionXml = await captionResponse.text();
    
    // Parse XML and extract text
    const textMatches = Array.from(captionXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g));
    
    if (textMatches.length === 0) {
      throw new Error('No transcript text found');
    }
    
    const transcript = textMatches
      .map(match => match[1])
      .join(' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get title
    const title = await fetchVideoTitle(videoId);
    
    return { text: transcript, title };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch video transcript. The video may not have captions enabled or may be restricted.');
  }
}

// Generate summary using Lovable AI
async function generateSummary(transcript: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    return 'Summary unavailable (AI not configured)';
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise summaries of video transcripts. Focus on key points and main ideas.'
          },
          {
            role: 'user',
            content: `Please provide a clear and concise summary of this video transcript:\n\n${transcript.slice(0, 15000)}`
          }
        ],
      }),
    });
    
    if (!response.ok) {
      console.error('AI API error:', response.status);
      return 'Summary unavailable';
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Summary unavailable';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Summary unavailable';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('YouTube URL is required');
    }
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    console.log('Processing video:', videoId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if we have a cached transcript that hasn't expired
    const { data: cached, error: cacheError } = await supabase
      .from('youtube_transcripts')
      .select('*')
      .eq('video_id', videoId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (cached && !cacheError) {
      console.log('Returning cached transcript');
      return new Response(
        JSON.stringify({
          videoId,
          title: cached.title,
          transcript: cached.transcript,
          summary: cached.summary,
          fromCache: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch fresh transcript
    console.log('Fetching fresh transcript');
    const { text: transcript, title } = await fetchTranscript(videoId);
    
    // Generate summary
    console.log('Generating summary');
    const summary = await generateSummary(transcript);
    
    // Store in database (this will also trigger cleanup of expired entries)
    const { error: insertError } = await supabase
      .from('youtube_transcripts')
      .upsert({
        video_id: videoId,
        title,
        transcript,
        summary,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }, {
        onConflict: 'video_id'
      });
    
    if (insertError) {
      console.error('Error storing transcript:', insertError);
    }
    
    return new Response(
      JSON.stringify({
        videoId,
        title,
        transcript,
        summary,
        fromCache: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in youtube-explain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});