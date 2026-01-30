import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://api.apifree.ai/v1/chat/completions';
const MODEL = 'openai/gpt-5.2';
const MAX_TOKENS = 38000;

const SYSTEM_PROMPT = `You are an expert web developer. Return ONLY valid HTML - no markdown, no backticks, no explanations.

Rules:
- Complete HTML document starting with <!DOCTYPE html>
- CSS in <style> tag, JS in <script> before </body>
- Responsive, mobile-friendly, dark theme
- Modern CSS (flexbox, grid, gradients, glassmorphism)
- CDN assets only (Google Fonts, Font Awesome)
- No placeholders - complete working code`;

async function callAPIStream(apiKey: string, prompt: string): Promise<ReadableStream> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.body!;
}

async function callAPINonStream(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'API returned an error');
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in response');
  }

  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, stream = true } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
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

    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    let lastError: Error | null = null;

    // Streaming mode
    if (stream) {
      for (let i = 0; i < shuffledKeys.length; i++) {
        const apiKey = shuffledKeys[i];
        console.log(`[Stream] Trying key ${i + 1}`);
        
        try {
          const upstreamStream = await callAPIStream(apiKey, prompt);
          
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

          return new Response(upstreamStream.pipeThrough(transformStream), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        } catch (error) {
          console.error(`[Stream] Key ${i + 1} failed:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
    } else {
      // Non-streaming mode
      for (let i = 0; i < shuffledKeys.length; i++) {
        const apiKey = shuffledKeys[i];
        console.log(`Trying key ${i + 1}`);
        
        try {
          const code = await callAPINonStream(apiKey, prompt);
          
          if (!code.includes('<!DOCTYPE html') && !code.includes('<html')) {
            lastError = new Error('Response is not valid HTML');
            continue;
          }
          
          console.log(`Success with key ${i + 1}, length: ${code.length}`);
          
          return new Response(JSON.stringify({ code }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error(`Key ${i + 1} failed:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
    }

    return new Response(JSON.stringify({ 
      error: lastError?.message || 'All API keys failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('web-gen error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
