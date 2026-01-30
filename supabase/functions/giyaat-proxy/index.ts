import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }
    
    if (prompt.length > 1000) {
      throw new Error('Prompt too long (max 1000 characters)');
    }
    
    const validModels = ['fast', 'mid', 'large'];
    const selectedModel = validModels.includes(model) ? model : 'fast';
    
    console.log('Giyaat proxy streaming request:', { model: selectedModel, promptLength: prompt.length });
    
    // Timeout handling (90 seconds for streaming)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    // POST request with JSON body (matching Giyaat API)
    const response = await fetch('https://giyaaat.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: selectedModel }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Giyaat API error:', response.status, errorText);
      throw new Error(`Giyaat API error: ${response.status}`);
    }
    
    // Forward SSE stream directly to frontend using TransformStream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    // Start streaming response immediately
    const streamResponse = new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
    // Read from Giyaat and forward chunks in background
    (async () => {
      try {
        const reader = response.body!.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Forward raw SSE data to frontend
          await writer.write(value);
        }
        
        console.log('Giyaat proxy streaming completed');
      } catch (error) {
        console.error('Giyaat streaming error:', error);
        // Send error event to client
        const errorEvent = `data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`;
        await writer.write(encoder.encode(errorEvent));
      } finally {
        await writer.close();
      }
    })();
    
    return streamResponse;
    
  } catch (error) {
    console.error('Giyaat proxy error:', error);
    let errorMessage = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. GIYAAT server may be slow.';
        errorCode = 'TIMEOUT';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Could not reach GIYAAT server. Please try again.';
        errorCode = 'CONNECTION_ERROR';
      } else {
        errorMessage = error.message;
        errorCode = 'API_ERROR';
      }
    }
    
    return new Response(JSON.stringify({ error: errorMessage, code: errorCode }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
