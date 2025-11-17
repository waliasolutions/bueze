import { useState, useEffect } from 'react';
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
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [pageKey]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', pageKey)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setContent(data);
    } catch (err: any) {
      console.error('Error fetching page content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, refetch: fetchContent };
};

export const useAllPageContent = (contentType?: string) => {
  const [contents, setContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContent();
  }, [contentType]);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('page_content')
        .select('*')
        .eq('status', 'published');

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query.order('page_key');

      if (error) throw error;
      setContents(data || []);
    } catch (err: any) {
      console.error('Error fetching page contents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { contents, loading, error, refetch: fetchAllContent };
};
