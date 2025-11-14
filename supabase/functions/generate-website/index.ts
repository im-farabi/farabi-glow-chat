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

    // Prioritize seed tier key for openai-large
    const seedKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');
    const backupKey = Deno.env.get('POLLINATIONS_API_KEY');

    if (!seedKey && !backupKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a website code generator. Generate complete, working website code based on user descriptions.

CRITICAL RULES:
1. Generate three separate code sections: HTML, CSS, and JavaScript
2. HTML must include complete structure with <!DOCTYPE html>, <head>, and <body>
3. CSS should be modern, responsive, and visually appealing with animations when requested
4. JavaScript MUST be included for: redirects, button clicks, form handling, or any interactive features
5. Keep websites simple - no backend, no external APIs, no frameworks
6. Use inline comments to explain key sections
7. Always generate the JAVASCRIPT section even if empty - write "// No JavaScript needed" if truly none required

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
=== HTML ===
[complete HTML code here]

=== CSS ===
[complete CSS code here]

=== JAVASCRIPT ===
[complete JavaScript code here OR "// No JavaScript needed"]

IMPORTANT: 
- Follow this exact format with the === markers!
- For redirects, ALWAYS use JavaScript with window.location or onclick handlers
- For animations, prefer CSS but use JS for complex interactions`;

    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'openai-large',
      seed: Date.now(),
      jsonMode: false
    };

    const makeRequest = async (apiKey: string, retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retry attempt ${attempt} after 300ms backoff...`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          // Retry on transient server errors
          if ([502, 503, 504].includes(response.status) && attempt < retries) {
            console.log(`Got ${response.status}, will retry...`);
            continue;
          }

          return response;
        } catch (error) {
          if (attempt === retries) throw error;
          console.log(`Network error on attempt ${attempt + 1}, retrying...`);
        }
      }
      throw new Error('Max retries exceeded');
    };

    let response: Response | undefined;

    try {
      // Try seed key first if available
      if (seedKey) {
        console.log('Using seed tier API key for openai-large...');
        response = await makeRequest(seedKey);
      } else if (backupKey) {
        console.log('Using backup API key...');
        response = await makeRequest(backupKey);
      }

      // If first key fails and alternate exists, try alternate
      if (response && !response.ok && seedKey && backupKey) {
        console.log('Seed key failed, trying backup key...');
        response = await makeRequest(backupKey);
      }
    } catch (error) {
      console.error('Error calling Pollinations API:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate website. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response received';
      console.error(`Pollinations API error (${response?.status || 'unknown'}):`, errorText);

      // Handle specific error codes
      if (response?.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please upgrade your API key or add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

    // Ensure JAVASCRIPT section is populated when prompt implies interactivity (e.g., redirects)
    let finalJs = js && js.trim().length > 0 ? js : '';
    if (!finalJs) {
      const urlMatch = (prompt as string).match(/https?:\/\/[^\s]+|[a-z0-9.-]+\.[a-z]{2,}/i);
      if (urlMatch) {
        const rawUrl = urlMatch[0];
        const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        finalJs = `// Auto-generated redirect handler based on your prompt\ndocument.addEventListener('DOMContentLoaded', function () {\n  var targetUrl = "${normalizedUrl}";\n  var candidates = Array.prototype.slice.call(document.querySelectorAll('a, button, [role="button"], .cta, #cta'));\n  var bound = false;\n  for (var i = 0; i < candidates.length; i++) {\n    var el = candidates[i];\n    var text = (el.textContent || '').trim().toLowerCase();\n    if (text.indexOf('click me') !== -1 || el.id === 'cta' || (el.classList && el.classList.contains('cta'))) {\n      el.addEventListener('click', function (e) { e.preventDefault(); window.location.href = targetUrl; });\n      bound = true;\n      break;\n    }\n  }\n  if (!bound) {\n    document.body.addEventListener('click', function (e) {\n      var t = e.target;\n      var btn = t && (t.closest ? t.closest('a, button, [role="button"], .cta, #cta') : null);\n      if (btn) { e.preventDefault(); window.location.href = targetUrl; }\n    }, { once: true });\n  }\n});`;
      } else {
        finalJs = '// No JavaScript needed';
      }
    }

    console.log('Successfully generated website code');

    return new Response(
      JSON.stringify({ html, css, js: finalJs }),
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
