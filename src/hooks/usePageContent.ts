import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  id: string;
  page_key: string;
  content_type: string;
  fields: any;
  seo: any;
  status: string;
}

/**
 * Normalize SEO fields from database to consistent frontend format
 * Handles legacy field names (meta_title, meta_description, canonical_url, robots_meta)
 * and converts to standard names (title, description, canonical, robots)
 */
function normalizeSeoData(seo: any): any {
  if (!seo) return null;
  
  return {
    // Use new field names, fall back to legacy names
    title: seo.title || seo.meta_title || null,
    description: seo.description || seo.meta_description || null,
    canonical: seo.canonical || seo.canonical_url || null,
    robots: seo.robots || seo.robots_meta || 'index,follow',
    og_image: seo.og_image || null,
    // Keep any additional fields
    ...seo,
  };
}

export const usePageContent = (pageKey: string) => {
  const { data: content, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['page-content', pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', pageKey)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      // Normalize SEO data for consistent frontend consumption
      return {
        ...data,
        seo: normalizeSeoData(data?.seo),
      } as PageContent;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - CMS content doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 1,
  });

  return { 
    content: content || null, 
    loading, 
    error: error?.message || null, 
    refetch 
  };
};

export const useAllPageContent = (contentType?: string) => {
  const { data: contents, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['page-content-all', contentType],
    queryFn: async () => {
      let query = supabase
        .from('page_content')
        .select('*')
        .eq('status', 'published');

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query.order('page_key');

      if (error) throw error;
      
      // Normalize SEO data for all items
      return (data || []).map(item => ({
        ...item,
        seo: normalizeSeoData(item?.seo),
      })) as PageContent[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  return { 
    contents: contents || [], 
    loading, 
    error: error?.message || null, 
    refetch 
  };
};
