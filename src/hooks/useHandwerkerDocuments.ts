import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HandwerkerDocument {
  id: string;
  handwerker_profile_id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  expiry_date: string | null;
  issued_date: string | null;
  issuing_authority: string | null;
  document_number: string | null;
  status: string;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseHandwerkerDocumentsResult {
  documents: HandwerkerDocument[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteDocument: (id: string) => Promise<boolean>;
  expiringCount: number;
  expiredCount: number;
}

export function useHandwerkerDocuments(userId: string | null): UseHandwerkerDocumentsResult {
  const [documents, setDocuments] = useState<HandwerkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('handwerker_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) return false;

      // Delete from storage - handle both relative paths and legacy full URLs
      let storagePath = doc.document_url;
      const urlParts = doc.document_url.split('/handwerker-documents/');
      if (urlParts.length === 2) {
        storagePath = urlParts[1].split('?')[0];
      }
      await supabase.storage
        .from('handwerker-documents')
        .remove([storagePath]);

      // Delete from database
      const { error: deleteError } = await supabase
        .from('handwerker_documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting document:', err);
      return false;
    }
  };

  // Calculate expiring and expired counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredCount = documents.filter(d => {
    if (!d.expiry_date) return false;
    const expiry = new Date(d.expiry_date);
    return expiry < today;
  }).length;

  const expiringCount = documents.filter(d => {
    if (!d.expiry_date) return false;
    const expiry = new Date(d.expiry_date);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry >= today && expiry <= thirtyDaysFromNow;
  }).length;

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    deleteDocument,
    expiringCount,
    expiredCount,
  };
}
