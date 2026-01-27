import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();
    
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }
    
    const validModels = ['fast', 'mid', 'large'];
    const selectedModel = validModels.includes(model) ? model : 'fast';
    
    console.log('Giyaat proxy request:', { model: selectedModel, promptLength: prompt.length });
    
    // Build Giyaat API URL
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://giyaaat.vercel.app/${encodedPrompt}?model=${selectedModel}`;
    
    // Timeout handling (45 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Giyaat API error: ${response.status}`);
    }
    
    const text = await response.text();
    
    console.log('Giyaat proxy success:', { model: selectedModel, responseLength: text.length });
    
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Giyaat proxy error:', error);
    let errorMessage = 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. GIYAAT server may be slow.';
        errorCode = 'TIMEOUT';
      } else if (error.message.includes('fetch')) {
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
