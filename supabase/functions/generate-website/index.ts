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
1. Generate EVERYTHING in a single HTML file with inline <style> and <script> tags
2. HTML must include complete structure with <!DOCTYPE html>, <head>, and <body>
3. Put ALL CSS inside <style> tags in the <head> section
4. Put ALL JavaScript inside <script> tags at the end of <body>
5. CSS should be modern, responsive, and visually appealing with animations when requested
6. JavaScript MUST be included for: redirects, button clicks, form handling, or any interactive features
7. Keep websites simple - no backend, no external APIs, no frameworks
8. Use inline comments to explain key sections

EXAMPLE FORMAT:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <style>
    /* All your CSS here */
  </style>
</head>
<body>
  <!-- All your HTML content here -->
  
  <script>
    // All your JavaScript here
  </script>
</body>
</html>

IMPORTANT: 
- For redirects, ALWAYS use JavaScript with window.location or onclick handlers
- For animations, prefer CSS but use JS for complex interactions
- Everything must be in ONE complete HTML file`;

    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'openai-large',
      seed: Date.now(),
      jsonMode: false,
      max_tokens: 8000
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

    // Extract the complete HTML (which now contains everything inline)
    const html = extractCompleteHTML(aiResponse);

    if (!html || html.trim().length === 0) {
      console.error('Failed to parse HTML from response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate valid website code. Please try a different prompt.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that HTML is complete (not truncated)
    if (!html.trim().endsWith('</html>')) {
      console.warn('AI response was truncated. HTML does not end with </html>. Length:', html.length);
      return new Response(
        JSON.stringify({ error: 'The AI response was incomplete. Please try using a simpler or shorter prompt.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated complete website code, length:', html.length);

    return new Response(
      JSON.stringify({ html, css: '', js: '' }),
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

function extractCompleteHTML(aiResponse: string): string {
  // Remove markdown code blocks if present
  let cleanResponse = aiResponse.replace(/```html\n?/gi, '').replace(/```\n?/g, '');

  // Try to extract complete HTML document
  const docTypeMatch = cleanResponse.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (docTypeMatch) {
    return docTypeMatch[1].trim();
  }

  // If no DOCTYPE found, check if response is already clean HTML
  if (cleanResponse.trim().startsWith('<html') || cleanResponse.trim().startsWith('<!DOCTYPE')) {
    return cleanResponse.trim();
  }

  return "";
}
