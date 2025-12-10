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
      return data as PageContent;
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
      return (data || []) as PageContent[];
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
