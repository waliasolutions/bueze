import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // Fetch the sitemap from Supabase Storage
        const { data, error } = await supabase.storage
          .from('sitemaps')
          .download('sitemap.xml');

        if (error) throw error;

        // Convert blob to text
        const text = await data.text();
        setSitemapXml(text);
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        setSitemapXml('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return null;
  }

  // Return the XML directly - React will render it as text
  return (
    <pre style={{ 
      margin: 0, 
      padding: 0, 
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }}>
      {sitemapXml}
    </pre>
  );
};

export default Sitemap;
