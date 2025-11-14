import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both POST (JSON body) and GET (query params)
    let slug: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        slug = body.slug;
      } catch {
        // If JSON parsing fails, try query params
      }
    }
    
    if (!slug) {
      const url = new URL(req.url);
      slug = url.searchParams.get('slug');
    }
    
    console.log('Serving website:', slug);

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch website
    const { data: website, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !website) {
      console.error('Website not found for slug:', slug, error);
      return new Response(
        JSON.stringify({ error: 'Website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment view count (non-blocking)
    supabase
      .from('user_websites')
      .update({ views_count: (website.views_count || 0) + 1 })
      .eq('id', website.id)
      .then(({ error }) => {
        if (error) console.error('Failed to increment view count:', error);
      });

    // Combine HTML, CSS, and JS
    let fullHtml = website.html_content;

    // Add CSS if provided
    if (website.css_content) {
      if (fullHtml.includes('</head>')) {
        fullHtml = fullHtml.replace('</head>', `<style>${website.css_content}</style></head>`);
      } else {
        fullHtml = `<style>${website.css_content}</style>` + fullHtml;
      }
    }

    // Add JS if provided
    if (website.js_content) {
      if (fullHtml.includes('</body>')) {
        fullHtml = fullHtml.replace('</body>', `<script>${website.js_content}</script></body>`);
      } else {
        fullHtml += `<script>${website.js_content}</script>`;
      }
    }

    // Ensure proper HTML structure
    if (!fullHtml.includes('<!DOCTYPE')) {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${website.title}</title>
</head>
<body>
${fullHtml}
</body>
</html>`;
    }

    return new Response(fullHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });

  } catch (error) {
    console.error('Error in serve-website:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
