import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, bookContext, bookTitle } = await req.json();

    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const systemPrompt = `You're a chill book buddy helping someone understand "${bookTitle}".

You have the book overview below. Your job: explain things so ANYONE can get it.

BOOK OVERVIEW:
${bookContext}

YOUR VIBE:
- Talk like a friend explaining to another friend, NOT a textbook
- Use casual language: "basically", "ngl", "lowkey", "fr", "the thing is..."
- Use 1-2 emojis per response max (💀 👉 ✨ 🤔 etc)
- Break down complex ideas into "what it ACTUALLY means"
- Keep it SHORT - no walls of text
- If they share a confusing line, explain it like: "What that line is really saying is..."

BAD RESPONSE EXAMPLE (don't do this):
"The author utilizes the metaphor of the green light to symbolize Gatsby's aspirational dreams and the American ideals of hope and success."

GOOD RESPONSE EXAMPLE (do this):
"That green light? It's basically Gatsby staring at his dreams across the water 💀 He's obsessed with what he can't have - the perfect future, Daisy, all of it."

NOW HELP THEM UNDERSTAND THIS BOOK! Keep it real, keep it simple.`;

    // Build messages array with system prompt
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Book chat request for:', bookTitle, 'messages:', messages.length);

    // Try openai-large first with streaming
    let response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai-large',
        messages: fullMessages,
        stream: true,
        max_tokens: 500
      })
    });

    // Fallback to openai if openai-large fails
    if (!response.ok) {
      console.log('openai-large failed, trying openai fallback');
      response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai',
          messages: fullMessages,
          stream: true,
          max_tokens: 500
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    // Stream the response directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in book-chat-stream:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
