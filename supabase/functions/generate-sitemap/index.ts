import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageContent {
  page_key: string;
  content_type: string;
  updated_at: string;
}

// All subcategory slugs for category landing pages
const subcategorySlugs = [
  // Elektroinstallationen
  'elektro-hausinstallationen', 'elektro-unterverteilung', 'elektro-stoerung-notfall',
  'elektro-beleuchtung', 'elektro-geraete-anschliessen', 'elektro-netzwerk-multimedia',
  'elektro-sprechanlage', 'elektro-smart-home', 'elektro-wallbox', 'elektro-erdung-blitzschutz',
  'elektro-sicherheitsnachweis', 'elektro-zaehler-anmeldung', 'elektro-notstrom', 'elektro-kleinauftraege',
  'elektriker',
  // Bau & Renovation
  'metallbau', 'holzbau', 'mauerarbeit', 'betonarbeiten', 'fundament', 'kernbohrungen',
  'abbruch-durchbruch', 'renovierung-sonstige', 'garage-carport', 'aussenarbeiten-sonstige',
  // Bodenbeläge
  'parkett-laminat', 'teppich-pvc-linoleum', 'bodenfliesen', 'bodenbelag-sonstige',
  // Heizung, Klima & Solar
  'fussbodenheizung', 'boiler', 'klimaanlage-lueftung', 'waermepumpen', 'cheminee-kamin-ofen',
  'solarheizung', 'photovoltaik', 'heizung-sonstige',
  // Sanitär
  'badewanne-dusche', 'klempnerarbeiten', 'sanitaer-sonstige',
  // Küche
  'kuechenplanung', 'kuechengeraete', 'arbeitsplatten', 'kueche-sonstige',
  // Innenausbau & Schreiner
  'moebelbau', 'moebelrestauration', 'holzarbeiten-innen', 'metallarbeiten-innen',
  'treppen', 'innenausbau-sonstige', 'maler', 'gipser', 'bodenleger', 'plattenleger',
  'schreiner', 'maurer', 'zimmermann',
  // Räumung & Entsorgung
  'aufloesung-entsorgung', 'individuelle-anfrage',
  // Fenster & Türen
  'fenster', 'tueren', 'wintergarten', 'sonnenschutz-storen', 'fenster-tueren-sonstige',
  // Dach & Fassade
  'dachdecker', 'spengler-dach', 'fassade', 'isolation-daemmung', 'dach-fassade-sonstige',
  // Garten & Umgebung
  'gartengestaltung', 'gartenpflege', 'pool-schwimmteich', 'zaun-sichtschutz', 'gartenbau-sonstige',
  // Sicherheit
  'alarmanlagen', 'videoüberwachung', 'schloesser-schluessel', 'sicherheit-sonstige',
  // Umzug & Transport
  'umzug', 'transport', 'lagerung', 'umzug-sonstige'
];

// Major category slugs
const majorCategorySlugs = [
  'bau-renovation',
  'bodenbelaege',
  'elektroinstallationen',
  'heizung-klima',
  'sanitaer',
  'kueche',
  'innenausbau-schreiner',
  'raeumung-entsorgung',
  'fenster-tueren',
  'dach-fassade',
  'garten-umgebung',
  'sicherheit',
  'umzug-transport'
];

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

    const baseUrl = FRONTEND_URL;
    const now = new Date().toISOString();

    // Define static routes (PUBLIC INDEXABLE PAGES ONLY)
    // Excluded routes (noindex):
    // - /auth, /reset-password (authentication)
    // - /admin/* (admin panel)
    // - /dashboard, /handwerker-dashboard (user accounts)
    // - /submit-lead, /lead-submission-success (transactional - user requested)
    // - /browse-leads, /lead-details/* (transactional)
    
    // - /messages, /conversations (messaging)
    // - /profile, /handwerker-profile-edit, /handwerker-onboarding (account management)
    // - /checkout, /proposal-review (payment flow)
    // - /test-dashboard (testing)
    const staticRoutes = [
      { loc: '/', lastmod: now, priority: '1.0', changefreq: 'daily' },
      { loc: '/kategorien', lastmod: now, priority: '0.9', changefreq: 'weekly' },
      { loc: '/handwerker', lastmod: now, priority: '0.8', changefreq: 'weekly' },
      { loc: '/pricing', lastmod: now, priority: '0.7', changefreq: 'monthly' },
      // Legal pages - correct paths
      { loc: '/legal/agb', lastmod: now, priority: '0.3', changefreq: 'monthly' },
      { loc: '/datenschutz', lastmod: now, priority: '0.3', changefreq: 'monthly' },
      { loc: '/impressum', lastmod: now, priority: '0.3', changefreq: 'monthly' },
    ];

    // Build dynamic routes
    const dynamicRoutes: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    // Add major category routes
    majorCategorySlugs.forEach((slug) => {
      dynamicRoutes.push({
        loc: `/kategorien/${slug}`,
        lastmod: now,
        priority: '0.85',
        changefreq: 'weekly',
      });
    });

    // Add subcategory landing pages
    subcategorySlugs.forEach((slug) => {
      dynamicRoutes.push({
        loc: `/category/${slug}`,
        lastmod: now,
        priority: '0.7',
        changefreq: 'weekly',
      });
    });

    // Add dynamic routes from page_content table
    (pages as PageContent[])?.forEach((page) => {
      if (page.content_type === 'category' && page.page_key.startsWith('category_')) {
        const slug = page.page_key.replace('category_', '').replace(/_/g, '-');
        // Only add if not already in subcategorySlugs
        if (!subcategorySlugs.includes(slug)) {
          dynamicRoutes.push({
            loc: `/category/${slug}`,
            lastmod: page.updated_at,
            priority: '0.7',
            changefreq: 'weekly',
          });
        }
      }
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

    console.log(`Sitemap generated with ${allRoutes.length} URLs`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('sitemaps')
      .upload('sitemap.xml', xml, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading sitemap to storage:', uploadError);
      throw uploadError;
    }

    console.log('Sitemap successfully uploaded to storage');

    // Update the database with generation timestamp
    const { error: updateError } = await supabaseClient
      .from('site_seo_settings')
      .update({
        sitemap_last_generated: now,
        updated_at: now,
      })
      .eq('id', '1');

    if (updateError) {
      console.error('Error updating sitemap timestamp:', updateError);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('sitemaps')
      .getPublicUrl('sitemap.xml');

    // Return list of indexed URLs for Google Indexing API
    const indexableUrls = allRoutes.map(r => `${baseUrl}${r.loc}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Sitemap generated and uploaded successfully',
      url: urlData.publicUrl,
      timestamp: now,
      urlCount: allRoutes.length,
      indexableUrls
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
