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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published notes
    const { data: notes } = await supabase
      .from('shared_notes')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });

    // Fetch all published AIs
    const { data: ais } = await supabase
      .from('custom_ais')
      .select('random_id, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    // Static pages
    const staticPages = [
      { url: 'https://farabi.me/', priority: '1.0', changefreq: 'daily' },
      { url: 'https://farabi.me/about', priority: '0.8', changefreq: 'weekly' },
      { url: 'https://farabi.me/support', priority: '0.7', changefreq: 'monthly' },
      { url: 'https://farabi.me/terms', priority: '0.6', changefreq: 'monthly' },
      { url: 'https://farabi.me/privacy', priority: '0.6', changefreq: 'monthly' },
      { url: 'https://farabi.me/image-gen', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://farabi.me/mcq-gen', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://farabi.me/flashcard-gen', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://farabi.me/ai-maker', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://farabi.me/notes-share', priority: '0.8', changefreq: 'weekly' },
      { url: 'https://farabi.me/youtube-explain', priority: '0.8', changefreq: 'weekly' },
    ];

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add published notes
    if (notes && notes.length > 0) {
      for (const note of notes) {
        xml += '  <url>\n';
        xml += `    <loc>https://farabi.me/notes/${note.slug}</loc>\n`;
        xml += `    <lastmod>${note.updated_at.split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }
    }

    // Add published AI endpoints (sample prompts)
    if (ais && ais.length > 0) {
      for (const ai of ais) {
        xml += '  <url>\n';
        xml += `    <loc>https://farabi.me/ai/${ai.random_id}/prompt/Hello</loc>\n`;
        xml += `    <lastmod>${ai.updated_at.split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      }
    }

    xml += '</urlset>';

    console.log(`Generated sitemap with ${staticPages.length} static pages, ${notes?.length || 0} notes, ${ais?.length || 0} AI endpoints`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
