import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  Eye, 
  Shield, 
  Wallet, 
  Building2, 
  FileText,
  X,
  HelpCircle
} from "lucide-react";

interface HandwerkerProfile {
  id: string;
  user_id: string;
  verification_status: string;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_documents: string[] | null;
  uid_number: string | null;
  insurance_valid_until: string | null;
  liability_insurance_provider: string | null;
  iban: string | null;
  bank_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentUploadCardProps {
  title: string;
  description: string;
  documentUrl?: string;
  documentType: 'uidCertificate' | 'insuranceDocument' | 'tradeLicense';
  onUpload: (file: File, type: string) => void;
  uploadProgress?: number;
  required?: boolean;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  description,
  documentUrl,
  documentType,
  onUpload,
  uploadProgress = 0,
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onUpload(selectedFile, documentType);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {required && <Badge variant="destructive" className="text-xs">Erforderlich</Badge>}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {documentUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Hochgeladen</p>
                <p className="text-xs text-green-700 truncate">
                  {documentUrl.split('/').pop()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(documentUrl, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ansehen
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ersetzen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress > 0 && uploadProgress < 100}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadProgress > 0 && uploadProgress < 100 
                ? `${Math.round(uploadProgress)}%` 
                : 'Dokument hochladen'}
            </Button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground">
              PDF, JPG oder PNG · Max. 10MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HandwerkerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [handwerkerProfile, setHandwerkerProfile] = useState<HandwerkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{
    uidCertificate?: number;
    insuranceDocument?: number;
    tradeLicense?: number;
  }>({});

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to handwerker_profiles changes for real-time updates
    const channel = supabase
      .channel('handwerker-verification-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'handwerker_profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setHandwerkerProfile(payload.new as HandwerkerProfile);
          
          // Show toast notification if status changed
          if (payload.new.verification_status !== payload.old.verification_status) {
            toast({
              title: "Status aktualisiert",
              description: getStatusConfig(payload.new.verification_status).message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      setUser(currentUser);

      // Fetch handwerker profile
      const { data: profileData, error } = await supabase
        .from('handwerker_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Fehler",
          description: "Profil konnte nicht geladen werden.",
          variant: "destructive",
        });
        return;
      }

      setHandwerkerProfile(profileData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!user?.id || !handwerkerProfile?.id) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Maximale Dateigröße: 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Nur PDF, JPG und PNG erlaubt",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('handwerker-documents')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('handwerker-documents')
        .getPublicUrl(fileName);

      // Update handwerker_profiles with new document URL
      const currentDocs = handwerkerProfile.verification_documents || [];
      const updatedDocs = [...currentDocs, urlData.publicUrl];

      const { error: updateError } = await supabase
        .from('handwerker_profiles')
        .update({
          verification_documents: updatedDocs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', handwerkerProfile.id);

      if (updateError) throw updateError;

      toast({
        title: "Dokument hochgeladen",
        description: "Das Dokument wurde erfolgreich hochgeladen und wird überprüft.",
      });

      // Refresh profile data
      fetchUserData();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
      }, 1000);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          label: 'Überprüfung ausstehend',
          icon: Clock,
          message: 'Ihr Profil wird derzeit überprüft. Dies dauert in der Regel 1-2 Werktage.',
          color: 'amber',
          bgClass: 'bg-amber-50 border-amber-200',
          textClass: 'text-amber-900',
        };
      case 'approved':
        return {
          variant: 'default' as const,
          label: 'Verifiziert',
          icon: CheckCircle,
          message: 'Ihr Profil wurde verifiziert! Sie können jetzt Leads durchsuchen und Angebote abgeben.',
          color: 'green',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-900',
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          label: 'Abgelehnt',
          icon: XCircle,
          message: 'Ihr Profil wurde abgelehnt. Bitte überprüfen Sie die Notizen und laden Sie die korrekten Dokumente hoch.',
          color: 'red',
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-900',
        };
      case 'needs_review':
        return {
          variant: 'outline' as const,
          label: 'Weitere Informationen erforderlich',
          icon: AlertCircle,
          message: 'Wir benötigen zusätzliche Informationen. Bitte überprüfen Sie die Notizen und laden Sie die angeforderten Dokumente hoch.',
          color: 'orange',
          bgClass: 'bg-orange-50 border-orange-200',
          textClass: 'text-orange-900',
        };
      default:
        return {
          variant: 'secondary' as const,
          label: 'Unbekannt',
          icon: HelpCircle,
          message: 'Status unbekannt',
          color: 'gray',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-900',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!handwerkerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Kein Handwerkerprofil gefunden.
                </p>
                <Button onClick={() => navigate('/handwerker-onboarding')}>
                  Profil erstellen
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusConfig = getStatusConfig(handwerkerProfile.verification_status);
  const StatusIcon = statusConfig.icon;

  // Check profile completeness
  const hasUidNumber = !!handwerkerProfile.uid_number;
  const hasInsurance = !!handwerkerProfile.liability_insurance_provider && !!handwerkerProfile.insurance_valid_until;
  const hasBankDetails = !!handwerkerProfile.iban && !!handwerkerProfile.bank_name;
  const hasCompanyInfo = !!handwerkerProfile.company_name;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Verifizierungs-Status</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Dokumente und verfolgen Sie den Verifizierungsprozess
            </p>
          </div>

          {/* Status Overview Card */}
          <Card className={`mb-6 ${statusConfig.bgClass}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={statusConfig.textClass}>Verifizierungsstatus</CardTitle>
                  <CardDescription className={statusConfig.textClass}>
                    {statusConfig.message}
                  </CardDescription>
                </div>
                <Badge variant={statusConfig.variant} className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            {handwerkerProfile.verified_at && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Zuletzt aktualisiert: {new Date(handwerkerProfile.verified_at).toLocaleDateString('de-CH')}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Admin Notes */}
          {handwerkerProfile.verification_notes && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Nachricht vom Verifizierungs-Team</AlertTitle>
              <AlertDescription className="text-blue-800 whitespace-pre-wrap">
                {handwerkerProfile.verification_notes}
              </AlertDescription>
            </Alert>
          )}

          {/* Document Upload Grid */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Dokumente</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <DocumentUploadCard
                title="UID-Zertifikat"
                description="Offizielles UID-Register Zertifikat"
                documentUrl={handwerkerProfile.verification_documents?.[0]}
                documentType="uidCertificate"
                onUpload={handleDocumentUpload}
                uploadProgress={uploadProgress.uidCertificate}
                required={true}
              />
              <DocumentUploadCard
                title="Haftpflichtversicherung"
                description="Nachweis der gültigen Versicherung"
                documentUrl={handwerkerProfile.verification_documents?.[1]}
                documentType="insuranceDocument"
                onUpload={handleDocumentUpload}
                uploadProgress={uploadProgress.insuranceDocument}
                required={true}
              />
              <DocumentUploadCard
                title="Gewerbebewilligung"
                description="Falls erforderlich für Ihre Branche"
                documentUrl={handwerkerProfile.verification_documents?.[2]}
                documentType="tradeLicense"
                onUpload={handleDocumentUpload}
                uploadProgress={uploadProgress.tradeLicense}
                required={false}
              />
            </div>
          </div>

          {/* Information Checklist */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profil-Vollständigkeit</CardTitle>
              <CardDescription>
                Überprüfen Sie, ob alle erforderlichen Informationen vorhanden sind
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {hasUidNumber ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">UID-Nummer</p>
                    <p className="text-xs text-muted-foreground">
                      {hasUidNumber ? handwerkerProfile.uid_number : 'Noch nicht angegeben'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasInsurance ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Haftpflichtversicherung</p>
                    <p className="text-xs text-muted-foreground">
                      {hasInsurance 
                        ? `${handwerkerProfile.liability_insurance_provider} (gültig bis ${new Date(handwerkerProfile.insurance_valid_until!).toLocaleDateString('de-CH')})` 
                        : 'Noch nicht angegeben'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasBankDetails ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Bankverbindung</p>
                    <p className="text-xs text-muted-foreground">
                      {hasBankDetails ? `${handwerkerProfile.bank_name}` : 'Noch nicht angegeben'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasCompanyInfo ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Firmeninformationen</p>
                    <p className="text-xs text-muted-foreground">
                      {hasCompanyInfo ? handwerkerProfile.company_name : 'Noch nicht angegeben'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/handwerker-onboarding')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Profil bearbeiten
            </Button>
            
            {handwerkerProfile.verification_status === 'approved' && (
              <Button onClick={() => navigate('/browse-leads')}>
                <Eye className="mr-2 h-4 w-4" />
                Leads durchsuchen
              </Button>
            )}

            {(handwerkerProfile.verification_status === 'rejected' || 
              handwerkerProfile.verification_status === 'needs_review') && (
              <Button variant="outline">
                <AlertCircle className="mr-2 h-4 w-4" />
                Support kontaktieren
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerDashboard;
