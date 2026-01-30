import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://api.apifree.ai/v1/chat/completions';
const MODEL = 'openai/gpt-5.2';
const MAX_TOKENS = 128000;

const SYSTEM_PROMPT = `You are an expert web developer. Generate complete, functional, and visually stunning HTML websites.

CRITICAL RULES:
1. Return ONLY valid HTML code - no explanations, no markdown, no backticks
2. Include all CSS in a <style> tag within the <head>
3. Include all JavaScript in a <script> tag before </body>
4. The website must be responsive and mobile-friendly
5. Use modern CSS (flexbox, grid, CSS variables, gradients)
6. Add smooth animations and transitions for premium feel
7. Use a dark theme by default with vibrant accent colors
8. Include proper meta tags and viewport settings
9. Make it visually stunning with gradients, shadows, and glassmorphism
10. All assets must be from CDN (Google Fonts, Font Awesome, etc.)
11. Code must be complete and working - no placeholders or "..."
12. Start with <!DOCTYPE html> and end with </html>

Style Guide:
- Background: Dark (#0a0a0a to #1a1a1a)
- Primary accent: Pink/Purple gradients (#ec4899 to #a855f7)
- Glassmorphic cards with backdrop-filter
- Smooth hover effects and transitions
- Modern sans-serif fonts (Inter, Poppins)
- Generous spacing and padding

Generate a complete, production-ready website based on the user's request.`;

async function callAPI(apiKey: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for large responses

  try {
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check for API error response
    if (data.error) {
      throw new Error(data.error.message || 'API returned an error');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all API keys
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

    // Shuffle keys for random selection
    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    
    let lastError: Error | null = null;
    
    // Try each key in order until one succeeds
    for (let i = 0; i < shuffledKeys.length; i++) {
      const apiKey = shuffledKeys[i];
      console.log(`Trying API key ${i + 1} of ${shuffledKeys.length}`);
      
      try {
        const code = await callAPI(apiKey, prompt);
        
        // Validate response looks like HTML
        if (!code.includes('<!DOCTYPE html') && !code.includes('<html')) {
          console.log('Response does not look like valid HTML, trying next key');
          lastError = new Error('Response is not valid HTML');
          continue;
        }
        
        console.log(`Success with key ${i + 1}, response length: ${code.length}`);
        
        return new Response(JSON.stringify({ code }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(`Key ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next key
      }
    }

    // All keys failed
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
