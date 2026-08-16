import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/** SSOT column projection for site SEO settings. */
const SITE_SETTINGS_SELECT =
  'id, gtm_container_id, google_analytics_id, google_search_console_verification, default_meta_title, default_meta_description, default_og_image, site_name, robots_txt, sitemap_url, sitemap_generated_at';

export const SITE_SETTINGS_QUERY_KEY = ['site-seo-settings'] as const;

/**
 * Site-wide SEO/GTM settings.
 *
 * Shared via React Query so the multiple consumers mounted on every route
 * (DynamicHelmet, GlobalScriptManager, admin pages) resolve to a single
 * request per session instead of one request per mount.
 */
export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  const {
    data: settings = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase
        .from('site_seo_settings')
        .select(SITE_SETTINGS_SELECT)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as SiteSettings) ?? null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      let targetId = settings?.id;

      if (!targetId) {
        const { data: existing, error: lookupError } = await supabase
          .from('site_seo_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (lookupError) throw lookupError;
        if (!existing?.id) throw new Error('No settings record found');
        targetId = existing.id;
      }

      const { data, error } = await supabase
        .from('site_seo_settings')
        .update(updates)
        .eq('id', targetId)
        .select(SITE_SETTINGS_SELECT)
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, data);
    },
  });

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      await mutation.mutateAsync(updates);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating site settings:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    settings,
    loading,
    error: error ? (error as Error).message : null,
    refetch,
    updateSettings,
  };
};
