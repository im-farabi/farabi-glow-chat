import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRAWLER_USER_AGENTS = [
  'googlebot', 'bingbot', 'slackbot', 'twitterbot', 'facebookexternalhit',
  'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'slack',
  'pinterest', 'reddit', 'yandex', 'duckduckbot', 'baiduspider',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot));
}

function generateAIHTML(ai: any, prompt: string, response: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ai.name} - ${prompt} - FARABI AI</title>
  <meta name="description" content="${ai.short_description}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${ai.name} - AI Response">
  <meta property="og:description" content="${ai.short_description}">
  <meta property="og:url" content="https://farabi.me/ai/${ai.random_id}/prompt/${encodeURIComponent(prompt)}">
  <meta property="og:site_name" content="FARABI.me">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${ai.name}">
  <meta name="twitter:description" content="${ai.short_description}">
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "${ai.name.replace(/"/g, '\\"')}",
    "description": "${ai.short_description.replace(/"/g, '\\"')}",
    "applicationCategory": "AI Assistant",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FARABI.me",
      "url": "https://farabi.me"
    }
  }
  </script>
  
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1a0033, #000);
      color: #e9d5ff;
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid #a855f7;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 20px 60px rgba(168, 85, 247, 0.3);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #a855f7;
      word-wrap: break-word;
    }
    .description {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 1rem;
    }
    .prompt-section {
      background: rgba(236, 72, 153, 0.1);
      border-left: 4px solid #ec4899;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .prompt-label {
      font-weight: bold;
      color: #ec4899;
      margin-bottom: 10px;
    }
    .response-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 30px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 1.05rem;
    }
    .cta {
      margin-top: 2rem;
      padding: 20px;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 8px;
      text-align: center;
    }
    .cta a {
      color: #a855f7;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .api-info {
      margin-top: 2rem;
      padding: 15px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .api-info code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 ${ai.name}</h1>
      <div class="description">${ai.short_description}</div>
      <div style="opacity: 0.7; font-size: 0.9rem;">👁️ ${ai.views_count.toLocaleString()} uses</div>
    </div>
    
    <div class="prompt-section">
      <div class="prompt-label">Your Prompt:</div>
      <div>${prompt}</div>
    </div>
    
    <div class="response-section">
      ${response}
    </div>
    
    <div class="cta">
      <p>Create your own AI endpoint at <a href="https://farabi.me/ai-maker">FARABI.me/ai-maker</a></p>
    </div>
    
    <div class="api-info">
      <strong>Developer API:</strong> 
      <code>https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/ai-endpoint/${ai.random_id}/YOUR_PROMPT</code>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const aiId = pathParts[pathParts.length - 2];
    const prompt = decodeURIComponent(pathParts[pathParts.length - 1]);
    const userAgent = req.headers.get('user-agent') || '';

    console.log('Prerender AI request:', aiId, prompt, 'User-Agent:', userAgent);

    // If not a crawler, redirect to React app
    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `/ai/${aiId}/prompt/${encodeURIComponent(prompt)}` }
      });
    }

    // Fetch AI from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ai, error } = await supabase
      .from('custom_ais')
      .select('*')
      .eq('random_id', aiId)
      .eq('is_published', true)
      .single();

    if (error || !ai) {
      console.error('AI not found:', error);
      return new Response('AI not found', { status: 404, headers: corsHeaders });
    }

    // Generate AI response
    const pollinationsApiKey = Deno.env.get('POLLINATIONS_API_KEY');
    const fullPrompt = `${ai.full_instructions}\n\nUser: ${prompt}`;

    const aiResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=gemini-search`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pollinationsApiKey}`,
      },
    });

    const responseText = await aiResponse.text();

    // Update view count
    await supabase
      .from('custom_ais')
      .update({ views_count: ai.views_count + 1 })
      .eq('id', ai.id);

    // Return pre-rendered HTML
    const html = generateAIHTML(ai, prompt, responseText);
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error in prerender-ai:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
