import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating website for prompt:', prompt);

    const pollinationsApiKey = Deno.env.get('POLLINATIONS_API_KEY');
    const fallbackKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');

    const systemPrompt = `You are a website code generator. Generate complete, working website code based on user descriptions.

CRITICAL RULES:
1. Generate three separate code sections: HTML, CSS, and JavaScript
2. HTML must include complete structure with <!DOCTYPE html>, <head>, and <body>
3. CSS should be modern, responsive, and visually appealing
4. JavaScript should be functional and bug-free (only if needed)
5. Keep websites simple - no backend, no external APIs, no frameworks
6. Use inline comments to explain key sections

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
=== HTML ===
[complete HTML code here]

=== CSS ===
[complete CSS code here]

=== JAVASCRIPT ===
[complete JavaScript code here]

IMPORTANT: Follow this exact format with the === markers!`;

    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'openai-large',
      seed: Date.now(),
      jsonMode: false
    };

    let response;
    let usedFallback = false;

    try {
      response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pollinationsApiKey && { 'X-API-Key': pollinationsApiKey })
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok && fallbackKey) {
        console.log('Primary API failed, trying fallback...');
        usedFallback = true;
        response = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': fallbackKey
          },
          body: JSON.stringify(requestBody)
        });
      }
    } catch (error) {
      console.error('Error calling Pollinations API:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate website. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error('Pollinations API error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to generate website. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.text();
    console.log('AI Response received, length:', aiResponse.length);

    // Parse the response to extract HTML, CSS, and JS
    const { html, css, js } = parseWebsiteCode(aiResponse);

    if (!html || html.trim().length === 0) {
      console.error('Failed to parse HTML from response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate valid website code. Please try a different prompt.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated website code');

    return new Response(
      JSON.stringify({ html, css, js }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-website function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseWebsiteCode(aiResponse: string): { html: string; css: string; js: string } {
  // Remove markdown code blocks if present
  let cleanResponse = aiResponse.replace(/```html\n?/gi, '').replace(/```css\n?/gi, '').replace(/```javascript\n?/gi, '').replace(/```\n?/g, '');

  // Try to extract using === markers
  const htmlMatch = cleanResponse.match(/===\s*HTML\s*===\s*([\s\S]*?)(?=\s*===\s*(?:CSS|JAVASCRIPT)|$)/i);
  const cssMatch = cleanResponse.match(/===\s*CSS\s*===\s*([\s\S]*?)(?=\s*===\s*(?:HTML|JAVASCRIPT)|$)/i);
  const jsMatch = cleanResponse.match(/===\s*JAVASCRIPT\s*===\s*([\s\S]*?)(?=\s*===\s*(?:HTML|CSS)|$)/i);

  let html = htmlMatch ? htmlMatch[1].trim() : "";
  let css = cssMatch ? cssMatch[1].trim() : "";
  let js = jsMatch ? jsMatch[1].trim() : "";

  // Fallback: if no markers found, try to extract HTML from the response
  if (!html) {
    const docTypeMatch = cleanResponse.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
    if (docTypeMatch) {
      html = docTypeMatch[1].trim();
    }
  }

  // Clean up any remaining markdown artifacts
  html = html.replace(/```/g, '').trim();
  css = css.replace(/```/g, '').trim();
  js = js.replace(/```/g, '').trim();

  return { html, css, js };
}
