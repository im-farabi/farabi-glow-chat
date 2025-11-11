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

// Fetch transcript from YouTube using innertube API
async function fetchTranscript(videoId: string): Promise<{ text: string; title: string }> {
  try {
    // Use youtube-transcript API endpoint
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.+?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Title';
    
    // Extract captions/transcript data
    const captionsMatch = html.match(/"captions":(\{.+?\}),"videoDetails/);
    if (!captionsMatch) {
      throw new Error('No captions available for this video');
    }
    
    const captionsData = JSON.parse(captionsMatch[1]);
    const captionTracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks found');
    }
    
    // Get first caption track (usually auto-generated English)
    const captionUrl = captionTracks[0].baseUrl;
    const captionResponse = await fetch(captionUrl);
    const captionXml = await captionResponse.text();
    
    // Parse XML and extract text
    const textMatches = captionXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
    const transcript = Array.from(textMatches)
      .map(match => match[1])
      .join(' ')
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;/g, '&');
    
    return { text: transcript, title };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch video transcript. The video may not have captions enabled.');
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