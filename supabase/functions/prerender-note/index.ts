import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of known crawler user agents
const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slack',
  'pinterest',
  'reddit',
  'yandex',
  'duckduckbot',
  'baiduspider',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot));
}

function generateNoteHTML(note: any): string {
  const themeColors = {
    'black-purple': { bg: '#1a0033', text: '#e9d5ff', accent: '#a855f7' },
    'black-white': { bg: '#0a0a0a', text: '#f5f5f5', accent: '#ffffff' },
    'black-orange': { bg: '#1a0700', text: '#fed7aa', accent: '#f97316' },
  };
  
  const theme = themeColors[note.color_theme as keyof typeof themeColors] || themeColors['black-purple'];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title} - FARABI Note</title>
  <meta name="description" content="${note.short_description || 'A shared note on FARABI.me'}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${note.title}">
  <meta property="og:description" content="${note.short_description || 'This is a note made by a user. Make notes and publish for free without sign up required.'}">
  <meta property="og:url" content="https://farabi.me/notes/${note.slug}">
  <meta property="og:site_name" content="FARABI.me">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${note.title}">
  <meta name="twitter:description" content="${note.short_description || 'A shared note on FARABI.me'}">
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${note.title.replace(/"/g, '\\"')}",
    "description": "${(note.short_description || '').replace(/"/g, '\\"')}",
    "datePublished": "${note.created_at}",
    "dateModified": "${note.updated_at}",
    "author": {
      "@type": "Person",
      "name": "FARABI User"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FARABI.me",
      "url": "https://farabi.me"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://farabi.me/notes/${note.slug}"
    }
  }
  </script>
  
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: ${theme.bg};
      color: ${theme.text};
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid ${theme.accent};
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: ${theme.accent};
      word-wrap: break-word;
    }
    .short-desc {
      font-size: 1.2rem;
      font-style: italic;
      margin-bottom: 2rem;
      opacity: 0.9;
      border-left: 4px solid ${theme.accent};
      padding-left: 16px;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 1.1rem;
    }
    .views {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
      opacity: 0.8;
    }
    .cta {
      margin-top: 2rem;
      padding: 20px;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 8px;
      text-align: center;
    }
    .cta a {
      color: ${theme.accent};
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${note.title}</h1>
    ${note.short_description ? `<div class="short-desc">${note.short_description}</div>` : ''}
    <div class="content">${note.description}</div>
    <div class="views">👁️ ${note.views_count.toLocaleString()} views</div>
    <div class="cta">
      <p>Create your own note for free at <a href="https://farabi.me">FARABI.me</a></p>
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
    const slug = url.pathname.split('/').pop();
    const userAgent = req.headers.get('user-agent') || '';

    console.log('Prerender request for slug:', slug, 'User-Agent:', userAgent);

    // If not a crawler, redirect to React app
    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `/notes/${slug}` }
      });
    }

    // Fetch note from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: note, error } = await supabase
      .from('shared_notes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !note) {
      console.error('Note not found:', error);
      return new Response('Note not found', { status: 404, headers: corsHeaders });
    }

    // Increment view count
    await supabase
      .from('shared_notes')
      .update({ views_count: note.views_count + 1 })
      .eq('id', note.id);

    // Log view with device type
    const deviceType = /iPhone|iPad|iPod|iOS/i.test(userAgent) ? 'ios' 
      : /Android|Mobi/i.test(userAgent) ? 'mobile' 
      : /Windows|Macintosh|Linux/i.test(userAgent) ? 'desktop' 
      : 'unknown';

    await supabase.from('note_views').insert({
      note_id: note.id,
      user_agent: userAgent,
      device_type: deviceType,
    });

    // Return pre-rendered HTML
    const html = generateNoteHTML(note);
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error in prerender-note:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
