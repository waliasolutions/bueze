import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, FileText, Download, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { majorCategories } from "@/config/majorCategories";
import { subcategoryLabels } from "@/config/subcategoryLabels";

interface HandwerkerProfile {
  id: string;
  user_id: string;
  // Personal Information
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  personal_address: string | null;
  personal_zip: string | null;
  personal_city: string | null;
  personal_canton: string | null;
  // Company Information
  company_name: string | null;
  company_legal_form: string | null;
  uid_number: string | null;
  mwst_number: string | null;
  business_address: string | null;
  business_zip: string | null;
  business_city: string | null;
  business_canton: string | null;
  iban: string | null;
  bank_name: string | null;
  liability_insurance_provider: string | null;
  liability_insurance_policy_number: string | null;
  trade_license_number: string | null;
  insurance_valid_until: string | null;
  categories: string[];
  verification_documents: string[];
  verification_status: string;
  verification_notes: string | null;
  bio: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

export default function HandwerkerVerification() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<HandwerkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<HandwerkerProfile | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Zugriff verweigert",
            description: "Bitte melden Sie sich an.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roleData) {
          toast({
            title: "Zugriff verweigert",
            description: "Diese Seite ist nur für Administratoren zugänglich.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [activeTab, isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("handwerker_profiles")
        .select(`
          *,
          profiles!inner (
            full_name,
            email,
            phone
          )
        `)
        .eq("verification_status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data as any || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Fehler",
        description: "Profile konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (profileId: string, status: "approved" | "rejected") => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("handwerker_profiles")
        .update({
          verification_status: status,
          verification_notes: verificationNotes,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          is_verified: status === "approved",
        })
        .eq("id", profileId);

      if (error) throw error;

      toast({
        title: status === "approved" ? "Profil genehmigt" : "Profil abgelehnt",
        description: `Das Handwerkerprofil wurde ${status === "approved" ? "genehmigt" : "abgelehnt"}.`,
      });

      setSelectedProfile(null);
      setVerificationNotes("");
      fetchProfiles();
    } catch (error) {
      console.error("Error updating verification:", error);
      toast({
        title: "Fehler",
        description: "Verifizierung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Ausstehend</Badge>;
      case "approved":
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Genehmigt</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Abgelehnt</Badge>;
      case "needs_review":
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Überprüfung nötig</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryLabels = (categories: string[]) => {
    return categories.map(cat => {
      const subcat = subcategoryLabels[cat];
      if (subcat) {
        const major = majorCategories[subcat.majorCategoryId];
        return `${major?.label} / ${subcat.label}`;
      }
      return cat;
    }).join(", ");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {checkingAuth ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Zugriff wird überprüft...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Handwerker-Verifizierung</h1>
            <p className="text-muted-foreground mt-2">
              Überprüfen und genehmigen Sie Handwerkerprofile
            </p>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Ausstehend</TabsTrigger>
          <TabsTrigger value="approved">Genehmigt</TabsTrigger>
          <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
          <TabsTrigger value="needs_review">Überprüfung nötig</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Lädt Profile...</p>
            </div>
          ) : profiles.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Keine Profile mit Status "{activeTab}" gefunden.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {profile.first_name && profile.last_name 
                            ? `${profile.first_name} ${profile.last_name}` 
                            : profile.company_name || profile.profiles?.full_name || "Kein Name"}
                        </CardTitle>
                        <CardDescription>
                          {profile.email || profile.profiles?.email} • {profile.phone_number || profile.profiles?.phone || "Keine Telefonnummer"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(profile.verification_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">UID-Nummer</p>
                        <p className="text-sm text-muted-foreground">{profile.uid_number || "Nicht angegeben"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Versicherung</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.liability_insurance_provider || "Nicht angegeben"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gültig bis</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.insurance_valid_until || "Nicht angegeben"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Kategorien</p>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryLabels(profile.categories)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setVerificationNotes(profile.verification_notes || "");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Details anzeigen
                      </Button>
                      {profile.verification_documents && profile.verification_documents.length > 0 && (
                        <Badge variant="secondary">
                          <FileText className="mr-1 h-3 w-3" />
                          {profile.verification_documents.length} Dokumente
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profil-Details: {selectedProfile?.company_name}</DialogTitle>
            <DialogDescription>
              Überprüfen Sie alle Informationen und Dokumente
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Persönliche Informationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">
                      {selectedProfile.first_name && selectedProfile.last_name 
                        ? `${selectedProfile.first_name} ${selectedProfile.last_name}`
                        : "Nicht angegeben"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                    <p className="text-sm">{selectedProfile.email || "Nicht angegeben"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p className="text-sm">{selectedProfile.phone_number || "Nicht angegeben"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Persönliche Adresse</p>
                    <div className="text-sm">
                      {selectedProfile.personal_address && (
                        <>
                          <p>{selectedProfile.personal_address}</p>
                          <p>{selectedProfile.personal_zip} {selectedProfile.personal_city}</p>
                          <p>{selectedProfile.personal_canton}</p>
                        </>
                      )}
                      {!selectedProfile.personal_address && "Nicht angegeben"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Business Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Firmeninformationen</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Firma:</strong> {selectedProfile.company_name || "Nicht angegeben"}</p>
                    <p><strong>Rechtsform:</strong> {selectedProfile.company_legal_form || "Nicht angegeben"}</p>
                    <p><strong>UID:</strong> {selectedProfile.uid_number || "Nicht angegeben"}</p>
                    <p><strong>MWST:</strong> {selectedProfile.mwst_number || "Nicht angegeben"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Geschäftsadresse</h4>
                  <div className="space-y-2 text-sm">
                    {selectedProfile.business_address ? (
                      <>
                        <p>{selectedProfile.business_address}</p>
                        <p>{selectedProfile.business_zip} {selectedProfile.business_city}</p>
                        <p>{selectedProfile.business_canton}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Nicht angegeben</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Bankinformationen</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>IBAN:</strong> {selectedProfile.iban || "Nicht angegeben"}</p>
                    <p><strong>Bank:</strong> {selectedProfile.bank_name || "Nicht angegeben"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Versicherung</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Anbieter:</strong> {selectedProfile.liability_insurance_provider || "Nicht angegeben"}</p>
                    <p><strong>Gültig bis:</strong> {selectedProfile.insurance_valid_until || "Nicht angegeben"}</p>
                    {selectedProfile.liability_insurance_policy_number && (
                      <p><strong>Police:</strong> {selectedProfile.liability_insurance_policy_number}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h4 className="font-semibold mb-2">Dienstleistungen</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Kategorien:</strong> {getCategoryLabels(selectedProfile.categories)}</p>
                  {(selectedProfile.hourly_rate_min || selectedProfile.hourly_rate_max) && (
                    <p>
                      <strong>Stundenansatz:</strong> CHF {selectedProfile.hourly_rate_min || '?'} - {selectedProfile.hourly_rate_max || '?'}
                    </p>
                  )}
                  {selectedProfile.bio && (
                    <div>
                      <strong>Beschreibung:</strong>
                      <p className="mt-1 text-muted-foreground">{selectedProfile.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedProfile.verification_documents && selectedProfile.verification_documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Hochgeladene Dokumente</h4>
                  <div className="grid gap-2">
                    {selectedProfile.verification_documents.map((doc, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start"
                        onClick={() => window.open(doc, '_blank')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Dokument {index + 1}
                        <Download className="ml-auto h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Verifizierungs-Notizen</Label>
                <Textarea
                  id="notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Interne Notizen zur Verifizierung..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {selectedProfile.verification_status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleVerification(selectedProfile.id, "rejected")}
                    disabled={processing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Ablehnen
                  </Button>
                  <Button
                    onClick={() => handleVerification(selectedProfile.id, "approved")}
                    disabled={processing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Genehmigen
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
