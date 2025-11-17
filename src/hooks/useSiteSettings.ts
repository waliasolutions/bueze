import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  id: string;
  gtm_container_id?: string;
  google_analytics_id?: string;
  google_search_console_verification?: string;
  default_meta_title?: string;
  default_meta_description?: string;
  default_og_image?: string;
  site_name?: string;
  robots_txt?: string;
  sitemap_url?: string;
  sitemap_generated_at?: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_seo_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err: any) {
      console.error('Error fetching site settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      const { data, error } = await supabase
        .from('site_seo_settings')
        .update(updates)
        .eq('id', settings?.id || '')
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating site settings:', err);
      return { success: false, error: err.message };
    }
  };

  return { settings, loading, error, refetch: fetchSettings, updateSettings };
};
