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

    const systemPrompt = `You are a helpful book assistant for "${bookTitle}".
You have access to the complete book overview below. Help users understand the book better:
- Explain difficult concepts or passages they don't understand
- Discuss themes, characters, and plot points
- Answer questions about specific parts of the book
- Clarify lines or quotes the user shares with you

BOOK OVERVIEW:
${bookContext}

GUIDELINES:
- Reference specific parts of the book when answering
- Use simple, clear language
- Be encouraging and supportive
- If user shares a confusing line, explain it in context
- Keep responses concise but helpful`;

    // Build messages array with system prompt
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Book chat request for:', bookTitle, 'messages:', messages.length);

    // Try openai-fast first with streaming
    let response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai-fast',
        messages: fullMessages,
        stream: true
      })
    });

    // Fallback to openai-mini if openai-fast fails
    if (!response.ok) {
      console.log('openai-fast failed, trying openai-mini fallback');
      response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai-mini',
          messages: fullMessages,
          stream: true
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
