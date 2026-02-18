import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useHandwerkerDocuments } from '@/hooks/useHandwerkerDocuments';
import { DocumentExpiryCard } from '@/components/DocumentExpiryCard';
import { DocumentUploadDialog } from '@/components/DocumentUploadDialog';
import { supabase } from '@/integrations/supabase/client';

interface DocumentManagementSectionProps {
  profileId: string;
  userId: string;
}

export function DocumentManagementSection({ profileId, userId }: DocumentManagementSectionProps) {
  const { toast } = useToast();
  const { documents, loading, refetch, deleteDocument } = useHandwerkerDocuments(userId);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  const handleUpload = (type: string) => {
    setSelectedDocType(type);
    setUploadDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteDocument(id);
    if (success) {
      toast({
        title: 'Dokument gelöscht',
        description: 'Das Dokument wurde erfolgreich entfernt.',
      });
    } else {
      toast({
        title: 'Fehler',
        description: 'Dokument konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (storedPath: string, name: string) => {
    // Generate a signed URL for the private bucket
    const { data, error } = await supabase.storage
      .from('handwerker-documents')
      .createSignedUrl(storedPath, 3600);

    if (error || !data?.signedUrl) {
      // Fallback: try as direct URL for legacy documents
      window.open(storedPath, '_blank');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  if (loading || !userId || !profileId) {
    return null;
  }

  return (
    <>
      <DocumentExpiryCard
        documents={documents}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
      
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        documentType={selectedDocType}
        handwerkerProfileId={profileId}
        userId={userId}
        onSuccess={refetch}
      />
    </>
  );
}
