import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Upload, FileText, Calendar, Building2, Hash, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DOCUMENT_TYPES } from '@/components/DocumentExpiryCard';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  handwerkerProfileId: string;
  userId: string;
  onSuccess: () => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  documentType,
  handwerkerProfileId,
  userId,
  onSuccess,
}: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');

  const typeInfo = DOCUMENT_TYPES.find(t => t.id === documentType);
  const typeLabel = typeInfo?.label || 'Dokument';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Ungültiger Dateityp',
        description: 'Bitte laden Sie eine PDF, JPG oder PNG Datei hoch.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Datei zu gross',
        description: 'Die Datei darf maximal 10MB gross sein.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    if (!documentName) {
      setDocumentName(typeLabel);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Keine Datei ausgewählt',
        description: 'Bitte wählen Sie eine Datei aus.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/documents/${documentType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('handwerker-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Store relative path (not public URL) for private bucket
      // Insert document record
      const { error: insertError } = await supabase
        .from('handwerker_documents')
        .insert({
          handwerker_profile_id: handwerkerProfileId,
          user_id: userId,
          document_type: documentType,
          document_name: documentName || typeLabel,
          document_url: fileName,
          expiry_date: expiryDate || null,
          issued_date: issuedDate || null,
          issuing_authority: issuingAuthority || null,
          document_number: documentNumber || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Dokument hochgeladen',
        description: 'Ihr Dokument wurde erfolgreich gespeichert.',
      });

      // Reset form
      setSelectedFile(null);
      setDocumentName('');
      setExpiryDate('');
      setIssuedDate('');
      setIssuingAuthority('');
      setDocumentNumber('');
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Das Dokument konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setDocumentName('');
      setExpiryDate('');
      setIssuedDate('');
      setIssuingAuthority('');
      setDocumentNumber('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {typeLabel} hochladen
          </DialogTitle>
          <DialogDescription>
            Laden Sie Ihr Dokument hoch und geben Sie die Gültigkeitsdaten an.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Datei auswählen *</Label>
            <div 
              className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klicken Sie hier oder ziehen Sie eine Datei hierher
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG oder PNG (max. 10MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Document Name */}
          <div>
            <Label htmlFor="documentName">Dokumentname</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder={typeLabel}
              className="mt-1"
            />
          </div>

          {/* Expiry Date - Important! */}
          <div>
            <Label htmlFor="expiryDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Gültig bis
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sie erhalten automatische Erinnerungen vor Ablauf
            </p>
          </div>

          {/* Issued Date */}
          <div>
            <Label htmlFor="issuedDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ausstellungsdatum
            </Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Issuing Authority */}
          <div>
            <Label htmlFor="issuingAuthority" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Ausstellende Behörde/Firma
            </Label>
            <Input
              id="issuingAuthority"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="z.B. Kanton Zürich, AXA Versicherungen"
              className="mt-1"
            />
          </div>

          {/* Document Number */}
          <div>
            <Label htmlFor="documentNumber" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Dokumentennummer / Policennummer
            </Label>
            <Input
              id="documentNumber"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="z.B. POL-123456"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Abbrechen
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Hochladen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
