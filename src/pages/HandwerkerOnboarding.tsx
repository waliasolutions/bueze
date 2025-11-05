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

  const totalSteps = 4;
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            {/* Bold Header */}
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-foreground">Willkommen bei Büeze.ch</h2>
              <p className="text-lg text-muted-foreground">
                Ihr Handwerkerprofil in 4 Schritten
              </p>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                10-15 Minuten
              </Badge>
            </div>

            {/* Bold Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Benötigte Dokumente</CardTitle>
                      <CardDescription className="text-base mt-1">Für die Aktivierung erforderlich</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-base">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>UID-Nummer</span>
                    </div>
                    <div className="flex items-center gap-3 text-base">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Haftpflichtversicherung</span>
                    </div>
                    <div className="flex items-center gap-3 text-base">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>IBAN & Bankname</span>
                    </div>
                    <div className="flex items-center gap-3 text-base">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Firmenangaben</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-transparent">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-brand-500/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">⚡ Optional jetzt hochladen</CardTitle>
                      <CardDescription className="text-base mt-1">Schnellere Verifizierung</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <button
                    type="button"
                    onClick={() => setShowUploadSection(!showUploadSection)}
                    className="w-full text-left"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white border hover:border-primary transition-colors">
                        <span className="text-base font-medium">UID-Zertifikat</span>
                        {step0Uploads.uidCertificate ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white border hover:border-primary transition-colors">
                        <span className="text-base font-medium">Versicherungsnachweis</span>
                        {step0Uploads.insuranceDocument ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section - Expanded */}
            {showUploadSection && (
              <Card className="border-2 border-dashed border-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl">Dokumente hochladen</CardTitle>
                  <CardDescription className="text-base">
                    Kann auch später nachgereicht werden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* UID Certificate Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="step0-uid" className="text-base font-medium">UID-Zertifikat</Label>
                    {step0Uploads.uidCertificate ? (
                      <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-green-50 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-base flex-1 font-medium">{step0Uploads.uidCertificate.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep0Uploads(prev => ({ ...prev, uidCertificate: undefined }))}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          id="step0-uid"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStep0Uploads(prev => ({ ...prev, uidCertificate: file }));
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('step0-uid')?.click()}
                          className="w-full h-12 text-base"
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          Hochladen
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Insurance Document Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="step0-insurance" className="text-base font-medium">Versicherungsnachweis</Label>
                    {step0Uploads.insuranceDocument ? (
                      <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-green-50 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-base flex-1 font-medium">{step0Uploads.insuranceDocument.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep0Uploads(prev => ({ ...prev, insuranceDocument: undefined }))}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          id="step0-insurance"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStep0Uploads(prev => ({ ...prev, insuranceDocument: file }));
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('step0-insurance')?.click()}
                          className="w-full h-12 text-base"
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          Hochladen
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Simple Info */}
            <Alert className="border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base ml-2">
                Verifizierung erfolgt innerhalb 1-2 Werktagen. Fehlende Dokumente können Sie später hochladen.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Firmeninformationen</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLegalForm">Rechtsform *</Label>
              <Select
                value={formData.companyLegalForm}
                onValueChange={(value) => setFormData({ ...formData, companyLegalForm: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzelfirma">Einzelfirma</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ag">AG</SelectItem>
                  <SelectItem value="kollektivgesellschaft">Kollektivgesellschaft</SelectItem>
                  <SelectItem value="other">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="z.B. Max Muster Bau GmbH"
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uidNumber">UID-Nummer *</Label>
              <Input
                id="uidNumber"
                value={formData.uidNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, uidNumber: value });
                }}
                onBlur={(e) => {
                  const formatted = formatUID(e.target.value);
                  setFormData({ ...formData, uidNumber: formatted });
                }}
                placeholder="CHE-123.456.789"
              />
              {errors.uidNumber && (
                <p className="text-sm text-destructive">{errors.uidNumber}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Unternehmens-Identifikationsnummer vom BFS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mwstNumber">MWST-Nummer (optional)</Label>
              <Input
                id="mwstNumber"
                value={formData.mwstNumber}
                onChange={(e) => setFormData({ ...formData, mwstNumber: e.target.value })}
                placeholder="CHE-123.456.789 MWST"
              />
              {errors.mwstNumber && (
                <p className="text-sm text-destructive">{errors.mwstNumber}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Erforderlich bei Jahresumsatz über CHF 100'000
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="uidCertificate">UID-Zertifikat hochladen</Label>
              
              {step0Uploads.uidCertificate && !uploadedFiles.uidCertificate ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bereits hochgeladen</p>
                      <p className="text-xs text-muted-foreground">{step0Uploads.uidCertificate.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFiles(prev => ({ ...prev, uidCertificate: step0Uploads.uidCertificate }));
                      }}
                    >
                      Ersetzen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="uidCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'uidCertificate');
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('uidCertificate')?.click()}
                    className="w-full"
                    disabled={uploadProgress.uidCertificate === 'uploading'}
                  >
                    {uploadProgress.uidCertificate === 'uploading' ? (
                      <>Wird hochgeladen...</>
                    ) : uploadProgress.uidCertificate === 'success' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        {uploadedFiles.uidCertificate?.name}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        UID-Zertifikat auswählen
                      </>
                    )}
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                PDF, JPG oder PNG (max. 10MB)
                {step0Uploads.uidCertificate && " · Bereits in Schritt 0 hochgeladen"}
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Geschäftsadresse & Banking</h3>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="sameAsPersonal"
                checked={formData.sameAsPersonal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sameAsPersonal: checked as boolean })
                }
              />
              <Label htmlFor="sameAsPersonal" className="cursor-pointer">
                Gleich wie persönliche Adresse
              </Label>
            </div>

            {!formData.sameAsPersonal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Geschäftsadresse *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Strasse & Hausnummer"
                  />
                  {errors.businessAddress && (
                    <p className="text-sm text-destructive">{errors.businessAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessZip">PLZ *</Label>
                    <Input
                      id="businessZip"
                      value={formData.businessZip}
                      onChange={(e) => setFormData({ ...formData, businessZip: e.target.value })}
                      placeholder="8000"
                      maxLength={4}
                    />
                    {errors.businessZip && (
                      <p className="text-sm text-destructive">{errors.businessZip}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCity">Ort *</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                      placeholder="Zürich"
                    />
                    {errors.businessCity && (
                      <p className="text-sm text-destructive">{errors.businessCity}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCanton">Kanton *</Label>
                  <Select
                    value={formData.businessCanton}
                    onValueChange={(value) => setFormData({ ...formData, businessCanton: value })}
                  >
                    <SelectTrigger>
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
                    <p className="text-sm text-destructive">{errors.businessCanton}</p>
                  )}
                </div>
              </>
            )}

            <div className="border-t pt-4 mt-6">
              <h4 className="font-semibold mb-4">Bankinformationen</h4>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN *</Label>
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
                />
                {errors.iban && <p className="text-sm text-destructive">{errors.iban}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bankname *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="z.B. UBS, Credit Suisse, PostFinance"
                />
                {errors.bankName && (
                  <p className="text-sm text-destructive">{errors.bankName}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Versicherung & Lizenzen</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liabilityInsuranceProvider">Haftpflichtversicherung *</Label>
              <Input
                id="liabilityInsuranceProvider"
                value={formData.liabilityInsuranceProvider}
                onChange={(e) =>
                  setFormData({ ...formData, liabilityInsuranceProvider: e.target.value })
                }
                placeholder="z.B. Zürich Versicherung, AXA, Mobiliar"
              />
              {errors.liabilityInsuranceProvider && (
                <p className="text-sm text-destructive">{errors.liabilityInsuranceProvider}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policennummer (optional)</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceValidUntil">Gültig bis *</Label>
              <Input
                id="insuranceValidUntil"
                type="date"
                value={formData.insuranceValidUntil}
                onChange={(e) => setFormData({ ...formData, insuranceValidUntil: e.target.value })}
              />
              {errors.insuranceValidUntil && (
                <p className="text-sm text-destructive">{errors.insuranceValidUntil}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeLicenseNumber">Gewerbebewilligung (optional)</Label>
              <Input
                id="tradeLicenseNumber"
                value={formData.tradeLicenseNumber}
                onChange={(e) => setFormData({ ...formData, tradeLicenseNumber: e.target.value })}
                placeholder="Falls erforderlich"
              />
              <p className="text-sm text-muted-foreground">
                Abhängig von Branche und Kanton
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Versicherungsdokumente hochladen</h4>
              
              <div className="space-y-2">
                <Label htmlFor="insuranceDocument">Haftpflichtversicherung</Label>
                
                {step0Uploads.insuranceDocument && !uploadedFiles.insuranceDocument ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Bereits hochgeladen</p>
                        <p className="text-xs text-muted-foreground">{step0Uploads.insuranceDocument.name}</p>
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
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
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
                      className="w-full"
                      disabled={uploadProgress.insuranceDocument === 'uploading'}
                    >
                      {uploadProgress.insuranceDocument === 'uploading' ? (
                        <>Wird hochgeladen...</>
                      ) : uploadProgress.insuranceDocument === 'success' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          {uploadedFiles.insuranceDocument?.name}
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Versicherungspolice auswählen
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  PDF, JPG oder PNG (max. 10MB)
                  {step0Uploads.insuranceDocument && " · Bereits in Schritt 0 hochgeladen"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeLicense">Gewerbebewilligung (optional)</Label>
                <div className="flex items-center gap-2">
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
                    className="w-full"
                    disabled={uploadProgress.tradeLicense === 'uploading'}
                  >
                    {uploadProgress.tradeLicense === 'uploading' ? (
                      <>Wird hochgeladen...</>
                    ) : uploadProgress.tradeLicense === 'success' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        {uploadedFiles.tradeLicense?.name}
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Gewerbebewilligung auswählen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ihre Versicherungsunterlagen werden während des Verifizierungsprozesses überprüft.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Fachgebiete wählen</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Wählen Sie Ihre <strong>Hauptkategorien (erforderlich)</strong> und optional 
              Ihre spezifischen Fachgebiete für eine bessere Auffindbarkeit.
            </p>

            {errors.categories && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.categories}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Select Major Categories */}
            <div>
              <h4 className="font-semibold mb-3">Schritt 1: Hauptkategorien *</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(majorCategories).map((majorCat) => {
                  const Icon = majorCat.icon;
                  const isSelected = selectedMajorCategories.includes(majorCat.id);
                  
                  return (
                    <Card
                      key={majorCat.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-brand-600 bg-brand-50"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMajorCategories(prev => 
                            prev.filter(id => id !== majorCat.id)
                          );
                          // Remove all subcategories from this major category
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
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${majorCat.color} flex items-center justify-center text-white mx-auto mb-2`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium">{majorCat.label}</p>
                        {isSelected && (
                          <Badge className="mt-2 bg-brand-600 text-xs">✓</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Subcategories */}
            {selectedMajorCategories.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">
                  Schritt 2: Fachgebiete <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Wählen Sie spezifische Fachgebiete, um gezielter für passende Aufträge gefunden zu werden.
                </p>
                
                {selectedMajorCategories.map(majorCatId => {
                  const majorCat = majorCategories[majorCatId];
                  const subcats = majorCat.subcategories
                    .map(subId => subcategoryLabels[subId])
                    .filter(Boolean);
                  
                  return (
                    <Accordion key={majorCatId} type="single" collapsible defaultValue={majorCatId}>
                      <AccordionItem value={majorCatId} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${majorCat.color} flex items-center justify-center text-white`}>
                              <majorCat.icon className="w-4 h-4" />
                            </div>
                            {majorCat.label}
                            <Badge variant="secondary" className="ml-2">
                              {formData.categories.filter(cat => majorCat.subcategories.includes(cat)).length} gewählt (optional)
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-wrap gap-2 pt-3 pb-2">
                            {subcats.map(subcat => {
                              const isSelected = formData.categories.includes(subcat.value);
                              
                              return (
                                <Badge
                                  key={subcat.value}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer px-3 py-1.5 text-sm hover:bg-brand-100"
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
                                  {isSelected && <X className="ml-1 h-3 w-3" />}
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
            )}

            {/* Optional fields */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-semibold">Zusätzliche Angaben (optional)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Kurze Beschreibung</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Beschreiben Sie Ihre Dienstleistungen und Erfahrung..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMin">Stundensatz von (CHF)</Label>
                  <Input
                    id="hourlyRateMin"
                    type="number"
                    value={formData.hourlyRateMin}
                    onChange={(e) => setFormData({ ...formData, hourlyRateMin: e.target.value })}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMax">Stundensatz bis (CHF)</Label>
                  <Input
                    id="hourlyRateMax"
                    type="number"
                    value={formData.hourlyRateMax}
                    onChange={(e) => setFormData({ ...formData, hourlyRateMax: e.target.value })}
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            <Alert className="bg-warning/10 border-warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Manuelle Überprüfung erforderlich</strong>
                <p className="mt-1 text-sm">
                  Ihr Profil wird innerhalb von 1-2 Werktagen überprüft. Dies schützt Kundendaten
                  und stellt die Qualität der Plattform sicher.
                </p>
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
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Handwerkerprofil vervollständigen</CardTitle>
            <CardDescription>
              {currentStep === 0 
                ? "Willkommen - Dokumente bereithalten" 
                : `Schritt ${currentStep} von ${totalSteps}`
              }
            </CardDescription>
            <Progress value={progress} className="mt-2" />
          </CardHeader>

          <CardContent>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
              >
                Zurück
              </Button>

              {currentStep === 0 ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  Registrierung starten
                </Button>
              ) : currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  Weiter
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Wird gespeichert..." : "Profil einreichen"}
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
