import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://api.apifree.ai/v1/chat/completions';
const MODEL = 'openai/gpt-5.2';
const MAX_TOKENS = 4096;

const DEFAULT_SYSTEM_PROMPT = `You are FARABI-GPT5.2, a powerful AI assistant powered by OpenAI's GPT-5.2 model.
Be helpful, accurate, and conversational. Provide clear, well-structured responses.
Use markdown formatting when appropriate. Be concise but thorough.`;

async function callAPIStream(apiKey: string, messages: any[]): Promise<ReadableStream> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.body!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKeys = [
      Deno.env.get('APIFREE_API_KEY_1'),
      Deno.env.get('APIFREE_API_KEY_2'),
      Deno.env.get('APIFREE_API_KEY_3'),
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Shuffle keys randomly
    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    
    // Build messages array with system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...messages
    ];

    let lastError: Error | null = null;

    // Try each key in order
    for (let i = 0; i < shuffledKeys.length; i++) {
      const apiKey = shuffledKeys[i];
      console.log(`[GPT-5.2] Trying key ${i + 1}`);
      
      try {
        const upstreamStream = await callAPIStream(apiKey, fullMessages);
        
        // Transform SSE stream to extract content
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        });

        console.log(`[GPT-5.2] Success with key ${i + 1}`);
        
        return new Response(upstreamStream.pipeThrough(transformStream), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } catch (error) {
        console.error(`[GPT-5.2] Key ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    return new Response(JSON.stringify({ 
      error: lastError?.message || 'All API keys failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('apifree-chat error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
