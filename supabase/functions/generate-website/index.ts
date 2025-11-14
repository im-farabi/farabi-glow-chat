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
    const { prompt, type = 'all', context = {} } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${type} for prompt:`, prompt);

    // Prioritize seed tier key for openai-large
    const seedKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');
    const backupKey = Deno.env.get('POLLINATIONS_API_KEY');

    if (!seedKey && !backupKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    
    if (type === 'html') {
      systemPrompt = `You are an HTML code generator. Generate ONLY HTML structure based on user descriptions.

CRITICAL RULES:
1. Generate ONLY HTML - no CSS styling, no JavaScript
2. Include complete structure with <!DOCTYPE html>, <head>, and <body>
3. Use semantic HTML5 elements (header, nav, main, section, article, footer)
4. Add appropriate class names for styling later
5. Keep structure clean and simple
6. Use placeholder text where needed
7. Add comments to explain sections

RESPONSE FORMAT:
[complete HTML code here - just the HTML, nothing else]`;
    } else if (type === 'css') {
      const htmlContext = context.html || '';
      systemPrompt = `You are a CSS code generator. Generate ONLY CSS styling based on user descriptions.

EXISTING HTML STRUCTURE:
${htmlContext}

CRITICAL RULES:
1. Generate ONLY CSS - no HTML, no JavaScript
2. Make it modern, responsive, and visually appealing
3. Use animations and transitions when requested
4. Use mobile-first responsive design with media queries
5. Use modern CSS features (flexbox, grid, custom properties)
6. Add smooth transitions and hover effects
7. Match the class names from the HTML provided

RESPONSE FORMAT:
[complete CSS code here - just the CSS, nothing else]`;
    } else if (type === 'js') {
      const htmlContext = context.html || '';
      const cssContext = context.css || '';
      systemPrompt = `You are a JavaScript code generator. Generate ONLY JavaScript code based on user descriptions.

EXISTING HTML STRUCTURE:
${htmlContext}

EXISTING CSS:
${cssContext}

CRITICAL RULES:
1. Generate ONLY JavaScript - no HTML, no CSS
2. Add interactivity based on user request (redirects, animations, form handling, etc.)
3. Use modern ES6+ JavaScript
4. Add event listeners and DOM manipulation as needed
5. Keep code simple and well-commented
6. If no interactivity is needed, write "// No JavaScript needed"

RESPONSE FORMAT:
[complete JavaScript code here - just the JS, nothing else]`;
    } else {
      // Default 'all' type - generate everything
      systemPrompt = `You are a website code generator. Generate complete, working website code based on user descriptions.

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
    }

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

    // Handle single-section responses for specific types
    if (type === 'html') {
      const cleanHtml = aiResponse.trim();
      return new Response(
        JSON.stringify({ html: cleanHtml }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'css') {
      const cleanCss = aiResponse.trim();
      return new Response(
        JSON.stringify({ css: cleanCss }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'js') {
      const cleanJs = aiResponse.trim();
      return new Response(
        JSON.stringify({ js: cleanJs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For 'all' type, parse the full response
    const { html, css, js } = parseWebsiteCode(aiResponse);

    if (!html || html.trim().length === 0) {
      console.error('Failed to parse HTML from response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate valid website code. Please try a different prompt.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure CSS is populated - generate basic styling if empty
    let finalCss = css && css.trim().length > 0 ? css : `/* Basic styling */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

h1, h2, h3 {
  margin-bottom: 20px;
  color: #667eea;
}

button, .button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover, .button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}`;

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
      JSON.stringify({ html, css: finalCss, js: finalJs }),
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
