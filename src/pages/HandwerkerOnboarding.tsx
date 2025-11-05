import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SWISS_CANTONS } from "@/config/cantons";
import { validateUID, validateMWST, validateIBAN, formatIBAN, formatUID } from "@/lib/swissValidation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Wallet, Shield, Briefcase, X, Upload, FileText, CheckCircle, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { majorCategories } from "@/config/majorCategories";
import { subcategoryLabels } from "@/config/subcategoryLabels";
import { cn } from "@/lib/utils";

const HandwerkerOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{
    uidCertificate?: File;
    insuranceDocument?: File;
    tradeLicense?: File;
  }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    uidCertificate?: string;
    insuranceDocument?: string;
    tradeLicense?: string;
  }>({});
  const [step0Uploads, setStep0Uploads] = useState<{
    uidCertificate?: File;
    insuranceDocument?: File;
  }>({});
  const [showUploadSection, setShowUploadSection] = useState(false);

  const [formData, setFormData] = useState({
    // Company Information
    companyName: "",
    companyLegalForm: "einzelfirma",
    uidNumber: "",
    mwstNumber: "",
    
    // Business Address
    businessAddress: "",
    businessZip: "",
    businessCity: "",
    businessCanton: "",
    sameAsPersonal: false,
    
    // Banking
    iban: "",
    bankName: "",
    
    // Insurance & Licenses
    liabilityInsuranceProvider: "",
    policyNumber: "",
    tradeLicenseNumber: "",
    insuranceValidUntil: "",
    
    // Service Details (from existing handwerker_profiles)
    categories: [] as string[],
    serviceAreas: [] as string[],
    hourlyRateMin: "",
    hourlyRateMax: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 5;
  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Company Information validation
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Firmenname ist erforderlich";
      }
      if (!formData.uidNumber) {
        newErrors.uidNumber = "UID-Nummer ist erforderlich";
      } else if (!validateUID(formData.uidNumber)) {
        newErrors.uidNumber = "Ungültiges Format. Beispiel: CHE-123.456.789";
      }
      if (formData.mwstNumber && !validateMWST(formData.mwstNumber)) {
        newErrors.mwstNumber = "Ungültiges Format. Beispiel: CHE-123.456.789 MWST";
      }
    } else if (step === 2) {
      // Business Address validation
      if (!formData.sameAsPersonal) {
        if (!formData.businessAddress.trim()) {
          newErrors.businessAddress = "Geschäftsadresse ist erforderlich";
        }
        if (!formData.businessZip) {
          newErrors.businessZip = "PLZ ist erforderlich";
        }
        if (!formData.businessCity.trim()) {
          newErrors.businessCity = "Ort ist erforderlich";
        }
        if (!formData.businessCanton) {
          newErrors.businessCanton = "Kanton ist erforderlich";
        }
      }
      
      // Banking validation
      if (!formData.iban) {
        newErrors.iban = "IBAN ist erforderlich";
      } else if (!validateIBAN(formData.iban)) {
        newErrors.iban = "Ungültige IBAN. Format: CH## #### #### #### #### #";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bankname ist erforderlich";
      }
    } else if (step === 3) {
      // Insurance validation
      if (!formData.liabilityInsuranceProvider.trim()) {
        newErrors.liabilityInsuranceProvider = "Versicherungsanbieter ist erforderlich";
      }
      if (!formData.insuranceValidUntil) {
        newErrors.insuranceValidUntil = "Gültigkeitsdatum ist erforderlich";
      }
    } else if (step === 4) {
      // Require at least 1 major category
      if (selectedMajorCategories.length === 0) {
        newErrors.categories = "Bitte wählen Sie mindestens eine Hauptkategorie";
      }
      // Subcategories are optional - no validation needed
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Skip validation for Step 0 (welcome screen)
    if (currentStep === 0 || validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFileUpload = async (file: File, type: 'uidCertificate' | 'insuranceDocument' | 'tradeLicense') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      setUploadProgress(prev => ({ ...prev, [type]: 'uploading' }));

      const { error: uploadError } = await supabase.storage
        .from('handwerker-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(prev => ({ ...prev, [type]: 'success' }));
      setUploadedFiles(prev => ({ ...prev, [type]: file }));

      toast({
        title: "Dokument hochgeladen",
        description: `${file.name} wurde erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Upload fehlgeschlagen",
        description: "Dokument konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Nicht angemeldet",
          description: "Bitte melden Sie sich zuerst an.",
          variant: "destructive",
        });
        navigate('/auth?role=handwerker');
        return;
      }

      // Verify user is actually a handwerker
      const userRole = user.user_metadata?.role;
      if (userRole !== 'handwerker') {
        toast({
          title: "Zugriff verweigert",
          description: "Diese Seite ist nur für Handwerker verfügbar.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Get user's personal address from profile if using same address
      let businessAddress = formData.businessAddress;
      let businessZip = formData.businessZip;
      let businessCity = formData.businessCity;
      let businessCanton = formData.businessCanton;

      if (formData.sameAsPersonal) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("address, zip, city, canton")
          .eq("id", user.id)
          .single();

        if (profile) {
          businessAddress = profile.address || "";
          businessZip = profile.zip || "";
          businessCity = profile.city || "";
          businessCanton = profile.canton || "";
        }
      }

      // Collect all uploaded files (merge Step 0 uploads with later uploads)
      const allUploads = {
        uidCertificate: uploadedFiles.uidCertificate || step0Uploads.uidCertificate,
        insuranceDocument: uploadedFiles.insuranceDocument || step0Uploads.insuranceDocument,
        tradeLicense: uploadedFiles.tradeLicense,
      };

      // Upload files to Supabase storage and collect URLs
      const verificationDocuments: string[] = [];
      
      for (const [type, file] of Object.entries(allUploads)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
          
          // Upload file if not already uploaded
          const { error: uploadError } = await supabase.storage
            .from('handwerker-documents')
            .upload(fileName, file);
          
          if (!uploadError) {
            const { data } = supabase.storage
              .from('handwerker-documents')
              .getPublicUrl(fileName);
            
            if (data?.publicUrl) {
              verificationDocuments.push(data.publicUrl);
            }
          }
        }
      }

      // Insert or update handwerker_profile
      const { error } = await supabase
        .from("handwerker_profiles")
        .upsert([{
          user_id: user.id,
          company_name: formData.companyName || null,
          company_legal_form: formData.companyLegalForm || null,
          uid_number: formData.uidNumber || null,
          mwst_number: formData.mwstNumber || null,
          business_address: businessAddress || null,
          business_zip: businessZip || null,
          business_city: businessCity || null,
          business_canton: businessCanton || null,
          iban: formData.iban.replace(/\s/g, "") || null,
          bank_name: formData.bankName || null,
          liability_insurance_provider: formData.liabilityInsuranceProvider,
          liability_insurance_policy_number: formData.policyNumber || null,
          trade_license_number: formData.tradeLicenseNumber || null,
          insurance_valid_until: formData.insuranceValidUntil,
          bio: formData.bio || null,
          categories: formData.categories as any[],
          service_areas: formData.serviceAreas.length > 0 ? formData.serviceAreas : [],
          hourly_rate_min: formData.hourlyRateMin ? parseInt(formData.hourlyRateMin) : null,
          hourly_rate_max: formData.hourlyRateMax ? parseInt(formData.hourlyRateMax) : null,
          verification_documents: verificationDocuments,
          verification_status: 'pending',
          is_verified: false,
        }]);

      if (error) throw error;

      toast({
        title: "Profil eingereicht",
        description: "Ihr Handwerkerprofil wird innerhalb von 1-2 Werktagen überprüft.",
      });

      navigate("/handwerker-dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper components for summary page
  interface SummaryItemProps {
    label: string;
    value: string;
  }

  const SummaryItem: React.FC<SummaryItemProps> = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );

  interface DocumentStatusProps {
    label: string;
    file?: File;
  }

  const DocumentStatus: React.FC<DocumentStatusProps> = ({ label, file }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {file ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Hochgeladen</span>
        </div>
      ) : (
        <Badge variant="secondary" className="text-xs">Optional</Badge>
      )}
    </div>
  );

  const legalFormLabels: Record<string, string> = {
    einzelfirma: "Einzelfirma",
    gmbh: "GmbH",
    ag: "AG",
    kollektivgesellschaft: "Kollektivgesellschaft",
    kommanditgesellschaft: "Kommanditgesellschaft",
    genossenschaft: "Genossenschaft",
    verein: "Verein",
    stiftung: "Stiftung",
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="space-y-4 pb-6">
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    In den nächsten Schritten erfassen wir Ihre Firmeninformationen. 
                    Folgende Angaben werden für die Verifizierung benötigt:
                  </p>
                  
                  <div className="space-y-3 ml-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base font-medium">UID-Nummer</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base font-medium">Haftpflichtversicherung-Gültigkeit</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-primary/30 bg-primary/5">
                  <Shield className="h-5 w-5 text-primary" />
                  <AlertDescription className="text-base ml-2">
                    <span className="font-semibold">Warum?</span>
                    <br />
                    Diese Verifizierung garantiert unseren Kunden die Qualität und Seriosität 
                    der Handwerker auf Büeze.ch.
                  </AlertDescription>
                </Alert>

                <Alert className="border-brand-300 bg-brand-50">
                  <Clock className="h-5 w-5 text-brand-600" />
                  <AlertDescription className="text-base ml-2">
                    <span className="font-semibold text-brand-700">Tipp</span>
                    <br />
                    Falls Sie diese Angaben bereit haben, wird Ihr Profil schneller aktiviert!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Adresse & Banking</h3>
                <p className="text-base text-muted-foreground">Geschäftsadresse und Bankverbindung</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="sameAsPersonal"
                checked={formData.sameAsPersonal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sameAsPersonal: checked as boolean })
                }
              />
              <Label htmlFor="sameAsPersonal" className="cursor-pointer text-base font-medium">
                Gleich wie persönliche Adresse
              </Label>
            </div>

            {!formData.sameAsPersonal && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="businessAddress" className="text-base font-medium">Geschäftsadresse *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Strasse & Hausnummer"
                    className="h-12 text-base"
                  />
                  {errors.businessAddress && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.businessAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="businessZip" className="text-base font-medium">PLZ *</Label>
                    <Input
                      id="businessZip"
                      value={formData.businessZip}
                      onChange={(e) => setFormData({ ...formData, businessZip: e.target.value })}
                      placeholder="8000"
                      maxLength={4}
                      className="h-12 text-base"
                    />
                    {errors.businessZip && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.businessZip}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="businessCity" className="text-base font-medium">Ort *</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                      placeholder="Zürich"
                      className="h-12 text-base"
                    />
                    {errors.businessCity && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.businessCity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="businessCanton" className="text-base font-medium">Kanton *</Label>
                  <Select
                    value={formData.businessCanton}
                    onValueChange={(value) => setFormData({ ...formData, businessCanton: value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Kanton wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {SWISS_CANTONS.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>
                          {canton.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessCanton && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.businessCanton}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Card className="border-2 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Bankinformationen</CardTitle>
                <CardDescription>Für Auszahlungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="iban" className="text-base font-medium">IBAN *</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, iban: value });
                    }}
                    onBlur={(e) => {
                      const formatted = formatIBAN(e.target.value);
                      setFormData({ ...formData, iban: formatted });
                    }}
                    placeholder="CH76 0000 0000 0000 0000 0"
                    className="h-12 text-base font-mono"
                  />
                  {errors.iban && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.iban}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bankName" className="text-base font-medium">Bankname *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="z.B. UBS, Credit Suisse, PostFinance"
                    className="h-12 text-base"
                  />
                  {errors.bankName && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.bankName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Versicherung & Lizenzen</h3>
                <p className="text-base text-muted-foreground">Haftpflicht und Bewilligungen</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="liabilityInsuranceProvider" className="text-base font-medium">Haftpflichtversicherung *</Label>
                <Input
                  id="liabilityInsuranceProvider"
                  value={formData.liabilityInsuranceProvider}
                  onChange={(e) =>
                    setFormData({ ...formData, liabilityInsuranceProvider: e.target.value })
                  }
                  placeholder="z.B. Zürich Versicherung, AXA, Mobiliar"
                  className="h-12 text-base"
                />
                {errors.liabilityInsuranceProvider && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.liabilityInsuranceProvider}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="policyNumber" className="text-base font-medium">Policennummer (optional)</Label>
                <Input
                  id="policyNumber"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="123456789"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="insuranceValidUntil" className="text-base font-medium">Gültig bis *</Label>
                <Input
                  id="insuranceValidUntil"
                  type="date"
                  value={formData.insuranceValidUntil}
                  onChange={(e) => setFormData({ ...formData, insuranceValidUntil: e.target.value })}
                  className="h-12 text-base"
                />
                {errors.insuranceValidUntil && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.insuranceValidUntil}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="tradeLicenseNumber" className="text-base font-medium">Gewerbebewilligung (optional)</Label>
                <Input
                  id="tradeLicenseNumber"
                  value={formData.tradeLicenseNumber}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNumber: e.target.value })}
                  placeholder="Falls erforderlich"
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Abhängig von Branche und Kanton
                </p>
              </div>
            </div>

            <Card className="border-2 border-dashed mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Versicherungsdokumente</CardTitle>
                <CardDescription>Nachweis hochladen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="insuranceDocument" className="text-base font-medium">Haftpflichtversicherung</Label>
                  
                  {step0Uploads.insuranceDocument && !uploadedFiles.insuranceDocument ? (
                    <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-base font-medium">Bereits hochgeladen</p>
                        <p className="text-sm text-muted-foreground">{step0Uploads.insuranceDocument.name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedFiles(prev => ({ ...prev, insuranceDocument: step0Uploads.insuranceDocument }));
                        }}
                      >
                        Ersetzen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        id="insuranceDocument"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'insuranceDocument');
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('insuranceDocument')?.click()}
                        className="w-full h-12 text-base"
                        disabled={uploadProgress.insuranceDocument === 'uploading'}
                      >
                        {uploadProgress.insuranceDocument === 'uploading' ? (
                          <>Wird hochgeladen...</>
                        ) : uploadProgress.insuranceDocument === 'success' ? (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                            {uploadedFiles.insuranceDocument?.name}
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-5 w-5" />
                            Versicherungspolice hochladen
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tradeLicense" className="text-base font-medium">Gewerbebewilligung (optional)</Label>
                  <Input
                    id="tradeLicense"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'tradeLicense');
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('tradeLicense')?.click()}
                    className="w-full h-12 text-base"
                    disabled={uploadProgress.tradeLicense === 'uploading'}
                  >
                    {uploadProgress.tradeLicense === 'uploading' ? (
                      <>Wird hochgeladen...</>
                    ) : uploadProgress.tradeLicense === 'success' ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                        {uploadedFiles.tradeLicense?.name}
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Gewerbebewilligung hochladen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Fachgebiete wählen</h3>
                <p className="text-base text-muted-foreground">Ihre Spezialisierungen</p>
              </div>
            </div>

            {errors.categories && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.categories}</AlertDescription>
              </Alert>
            )}

            {/* Major Categories */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Hauptkategorien *</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.values(majorCategories).map((majorCat) => {
                  const Icon = majorCat.icon;
                  const isSelected = selectedMajorCategories.includes(majorCat.id);
                  
                  return (
                    <Card
                      key={majorCat.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg hover-scale",
                        isSelected && "ring-2 ring-brand-600 bg-brand-50 shadow-lg"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMajorCategories(prev => 
                            prev.filter(id => id !== majorCat.id)
                          );
                          setFormData(prev => ({
                            ...prev,
                            categories: prev.categories.filter(
                              cat => !majorCat.subcategories.includes(cat)
                            )
                          }));
                        } else {
                          setSelectedMajorCategories(prev => [...prev, majorCat.id]);
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${majorCat.color} flex items-center justify-center text-white mx-auto mb-3 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold">{majorCat.label}</p>
                        {isSelected && (
                          <Badge className="mt-3 bg-brand-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Gewählt
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Subcategories */}
            {selectedMajorCategories.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Fachgebiete <span className="text-base font-normal text-muted-foreground">(optional)</span>
                </h4>
                <p className="text-base text-muted-foreground mb-4">
                  Wählen Sie spezifische Fachgebiete für gezieltere Aufträge
                </p>
                
                <div className="space-y-4">
                  {selectedMajorCategories.map(majorCatId => {
                    const majorCat = majorCategories[majorCatId];
                    const subcats = majorCat.subcategories
                      .map(subId => subcategoryLabels[subId])
                      .filter(Boolean);
                    
                    return (
                      <Accordion key={majorCatId} type="single" collapsible defaultValue={majorCatId}>
                        <AccordionItem value={majorCatId} className="border-2 rounded-lg px-4">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${majorCat.color} flex items-center justify-center text-white`}>
                                <majorCat.icon className="w-5 h-5" />
                              </div>
                              <span className="text-lg">{majorCat.label}</span>
                              <Badge variant="secondary" className="ml-2">
                                {formData.categories.filter(cat => majorCat.subcategories.includes(cat)).length} gewählt
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-3 pt-4 pb-2">
                              {subcats.map(subcat => {
                                const isSelected = formData.categories.includes(subcat.value);
                                
                                return (
                                  <Badge
                                    key={subcat.value}
                                    variant={isSelected ? "default" : "outline"}
                                    className="cursor-pointer px-4 py-2 text-sm hover-scale hover:bg-brand-100"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({
                                          ...prev,
                                          categories: prev.categories.filter(id => id !== subcat.value)
                                        }));
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          categories: [...prev.categories, subcat.value]
                                        }));
                                      }
                                    }}
                                  >
                                    {subcat.label}
                                    {isSelected && <CheckCircle className="ml-2 h-3 w-3" />}
                                  </Badge>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional fields */}
            <Card className="border-2 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Zusätzliche Angaben</CardTitle>
                <CardDescription>Optional - hilft bei der Vermittlung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="bio" className="text-base font-medium">Kurze Beschreibung</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Beschreiben Sie Ihre Dienstleistungen und Erfahrung..."
                    rows={4}
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="hourlyRateMin" className="text-base font-medium">Stundensatz von (CHF)</Label>
                    <Input
                      id="hourlyRateMin"
                      type="number"
                      value={formData.hourlyRateMin}
                      onChange={(e) => setFormData({ ...formData, hourlyRateMin: e.target.value })}
                      placeholder="80"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="hourlyRateMax" className="text-base font-medium">Stundensatz bis (CHF)</Label>
                    <Input
                      id="hourlyRateMax"
                      type="number"
                      value={formData.hourlyRateMax}
                      onChange={(e) => setFormData({ ...formData, hourlyRateMax: e.target.value })}
                      placeholder="120"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Zusammenfassung</h3>
                <p className="text-base text-muted-foreground">
                  Überprüfen Sie Ihre Angaben vor dem Absenden
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
              
              {/* 1. Company Information */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Firmeninformationen</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SummaryItem label="Firmenname" value={formData.companyName} />
                  <SummaryItem label="Rechtsform" value={legalFormLabels[formData.companyLegalForm] || formData.companyLegalForm} />
                  <SummaryItem label="UID-Nummer" value={formData.uidNumber} />
                  {formData.mwstNumber && (
                    <SummaryItem label="MWST-Nummer" value={formData.mwstNumber} />
                  )}
                </CardContent>
              </Card>

              {/* 2. Banking Information */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Zahlungsinformationen</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SummaryItem label="IBAN" value={formData.iban} />
                  <SummaryItem label="Bank" value={formData.bankName} />
                </CardContent>
              </Card>

              {/* 3. Insurance & Licenses */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Versicherung & Lizenzen</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SummaryItem label="Versicherungsanbieter" value={formData.liabilityInsuranceProvider} />
                  <SummaryItem label="Gültig bis" value={formData.insuranceValidUntil} />
                  {formData.policyNumber && (
                    <SummaryItem label="Policennummer" value={formData.policyNumber} />
                  )}
                  {formData.tradeLicenseNumber && (
                    <SummaryItem label="Gewerbelizenz" value={formData.tradeLicenseNumber} />
                  )}
                </CardContent>
              </Card>

              {/* 4. Service Details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Dienstleistungen</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(4)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Kategorien</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.length > 0 ? (
                        formData.categories.map((cat) => (
                          <Badge key={cat} variant="secondary">
                            {subcategoryLabels[cat]?.label || cat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine Kategorien ausgewählt</span>
                      )}
                    </div>
                  </div>
                  
                  {formData.serviceAreas.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Einsatzgebiete</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceAreas.map((area) => (
                          <Badge key={area} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.hourlyRateMin || formData.hourlyRateMax) && (
                    <SummaryItem 
                      label="Stundenansatz" 
                      value={`CHF ${formData.hourlyRateMin || '?'} - ${formData.hourlyRateMax || '?'}`} 
                    />
                  )}

                  {formData.bio && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</p>
                      <p className="text-sm">{formData.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5. Uploaded Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Hochgeladene Dokumente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DocumentStatus 
                    label="UID-Zertifikat" 
                    file={uploadedFiles.uidCertificate || step0Uploads.uidCertificate}
                  />
                  <DocumentStatus 
                    label="Versicherungsnachweis" 
                    file={uploadedFiles.insuranceDocument || step0Uploads.insuranceDocument}
                  />
                  <DocumentStatus 
                    label="Gewerbelizenz" 
                    file={uploadedFiles.tradeLicense}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Confirmation Alert */}
            <Alert className="border-2 border-primary/20 bg-primary/5">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base ml-2">
                Bitte überprüfen Sie alle Angaben sorgfältig. Nach dem Absenden 
                wird Ihr Profil innerhalb von 1-2 Werktagen durch unser Team verifiziert.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Visual Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[0, 1, 2, 3, 4, 5].map((step) => {
              const isCompleted = step < currentStep;
              const isCurrent = step === currentStep;
              const stepLabels = ['Start', 'Firma', 'Adresse', 'Versicherung', 'Fachgebiete', 'Prüfung'];
              
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground shadow-lg scale-110",
                    isCurrent && "bg-brand-500 text-white shadow-xl scale-125 ring-4 ring-brand-200",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : step + 1}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 font-medium text-center",
                    isCurrent && "text-brand-600 font-bold",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}>
                    {stepLabels[step]}
                  </p>
                  {step < 5 && (
                    <div className={cn(
                      "absolute w-full h-1 top-6 left-1/2 -z-10 transition-all duration-300",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} style={{ width: 'calc(100% / 6)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Handwerkerprofil erstellen</CardTitle>
                <CardDescription className="text-base mt-1">
                  {currentStep === 0 
                    ? "Willkommen - Dokumente bereithalten" 
                    : `Schritt ${currentStep} von ${totalSteps}`
                  }
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {Math.round(progress)}% fertig
              </Badge>
            </div>
            <Progress value={progress} className="mt-4 h-2" />
          </CardHeader>

          <CardContent className="pt-6">
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
                className="h-12 px-6 text-base"
              >
                Zurück
              </Button>

              {currentStep === 0 ? (
                <Button onClick={handleNext} disabled={isLoading} className="h-12 px-6 text-base">
                  Registrierung starten
                </Button>
              ) : currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isLoading} className="h-12 px-6 text-base">
                  {currentStep === 4 ? "Weiter zur Zusammenfassung" : "Weiter"}
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading} className="h-12 px-8 text-base bg-brand-600 hover:bg-brand-700">
                  {isLoading ? "Wird eingereicht..." : "Bestätigen & Profil einreichen"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HandwerkerOnboarding;
