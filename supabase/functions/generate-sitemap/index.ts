import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageContent {
  page_key: string;
  content_type: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all published page content
    const { data: pages, error } = await supabaseClient
      .from('page_content')
      .select('page_key, content_type, updated_at')
      .eq('status', 'published');

    if (error) throw error;

    const baseUrl = 'https://bueeze.ch';
    const now = new Date().toISOString();

    // Define static routes
    const staticRoutes = [
      { loc: '/', lastmod: now, priority: '1.0', changefreq: 'daily' },
      { loc: '/kategorien', lastmod: now, priority: '0.9', changefreq: 'weekly' },
      { loc: '/handwerker', lastmod: now, priority: '0.8', changefreq: 'weekly' },
      { loc: '/pricing', lastmod: now, priority: '0.7', changefreq: 'monthly' },
      { loc: '/auth', lastmod: now, priority: '0.5', changefreq: 'monthly' },
      { loc: '/agb', lastmod: now, priority: '0.3', changefreq: 'monthly' },
      { loc: '/datenschutz', lastmod: now, priority: '0.3', changefreq: 'monthly' },
      { loc: '/impressum', lastmod: now, priority: '0.3', changefreq: 'monthly' },
    ];

    // Build dynamic routes from page content
    const dynamicRoutes: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    (pages as PageContent[])?.forEach((page) => {
      if (page.content_type === 'category' && page.page_key.startsWith('category_')) {
        const slug = page.page_key.replace('category_', '').replace(/_/g, '-');
        dynamicRoutes.push({
          loc: `/kategorie/${slug}`,
          lastmod: page.updated_at,
          priority: '0.8',
          changefreq: 'weekly',
        });
      }
    });

    // Major category routes (hardcoded based on majorCategories.ts)
    const majorCategories = [
      'bau-renovation',
      'bodenbelaege',
      'elektroinstallationen',
      'heizung-klima',
      'sanitaer',
      'kuecheneinbau',
      'innenausbau',
      'entsorgung',
      'garten-aussengestaltung',
      'sonstige',
    ];

    majorCategories.forEach((slug) => {
      dynamicRoutes.push({
        loc: `/kategorie/${slug}`,
        lastmod: now,
        priority: '0.9',
        changefreq: 'weekly',
      });
    });

    // Combine all routes
    const allRoutes = [...staticRoutes, ...dynamicRoutes];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map((route) => `  <url>
    <loc>${baseUrl}${route.loc}</loc>
    <lastmod>${route.lastmod.split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
