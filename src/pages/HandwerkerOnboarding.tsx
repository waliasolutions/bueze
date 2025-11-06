import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SWISS_CANTONS } from "@/config/cantons";
import { validateUID, validateMWST, validateIBAN, formatIBAN, formatUID } from "@/lib/swissValidation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Building2, Wallet, Shield, Briefcase, X, Upload, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight, Loader2, User, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { majorCategories } from "@/config/majorCategories";
import { subcategoryLabels } from "@/config/subcategoryLabels";
import { cn } from "@/lib/utils";
import ServiceAreaMap from '@/components/ServiceAreaMap';

const HandwerkerOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [serviceAreaInput, setServiceAreaInput] = useState('');
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
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    progress: number;
    lastSaveTime: string;
    currentStep: number;
    totalSteps: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    personalAddress: "",
    personalZip: "",
    personalCity: "",
    personalCanton: "",
    
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
  const progress = ((currentStep - 1) / totalSteps) * 100;

  // Auto-save form data to localStorage
  useEffect(() => {
    const saveToLocalStorage = () => {
      const dataToSave = {
        currentStep,
        formData,
        selectedMajorCategories,
        timestamp: Date.now(),
      };
      localStorage.setItem('handwerker-onboarding-draft', JSON.stringify(dataToSave));
      setLastSaved(new Date());
    };

    const timeoutId = setTimeout(saveToLocalStorage, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentStep, formData, selectedMajorCategories]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const savedData = localStorage.getItem('handwerker-onboarding-draft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          
          // Only load if saved within last 7 days
          if (hoursSinceLastSave < 168) {
            // Calculate progress
            const savedProgress = ((parsed.currentStep - 1) / 5) * 100;
            
            // Format last save time
            const lastSaveDate = new Date(parsed.timestamp);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastSaveDate.getTime()) / (1000 * 60 * 60 * 24));
            
            let lastSaveTimeStr;
            if (diffDays === 0) {
              lastSaveTimeStr = `Heute um ${lastSaveDate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
            } else if (diffDays === 1) {
              lastSaveTimeStr = `Gestern um ${lastSaveDate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
              lastSaveTimeStr = lastSaveDate.toLocaleDateString('de-CH', { 
                day: '2-digit', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
            
            // Set recovery data and show dialog
            setRecoveryData({
              progress: savedProgress,
              lastSaveTime: lastSaveTimeStr,
              currentStep: parsed.currentStep,
              totalSteps: 5,
            });
            setShowRecoveryDialog(true);
            
            // Store the parsed data temporarily (don't load yet)
            sessionStorage.setItem('pending-recovery-data', JSON.stringify(parsed));
          } else {
            // Clear old data
            localStorage.removeItem('handwerker-onboarding-draft');
          }
        } catch (error) {
          console.error('Error loading saved data:', error);
          localStorage.removeItem('handwerker-onboarding-draft');
        }
      }
    };

    loadFromLocalStorage();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Company Information validation
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Firmenname ist erforderlich";
      }
      if (!formData.companyLegalForm) {
        newErrors.companyLegalForm = "Rechtsform ist erforderlich";
      }
      // UID is optional but validate format if provided
      if (formData.uidNumber && !validateUID(formData.uidNumber)) {
        newErrors.uidNumber = "Ungültiges Format. Beispiel: CHE-123.456.789";
      }
      if (formData.mwstNumber && !validateMWST(formData.mwstNumber)) {
        newErrors.mwstNumber = "Ungültiges Format. Beispiel: CHE-123.456.789 MWST";
      }
    } else if (step === 2) {
      // Personal Information validation
      // Name, Email, Phone: ALWAYS required for ALL legal forms
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Vorname ist erforderlich";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Nachname ist erforderlich";
      }
      if (!formData.email.trim()) {
        newErrors.email = "E-Mail-Adresse ist erforderlich";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Ungültige E-Mail-Adresse";
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Telefonnummer ist erforderlich";
      }
      
      // Address: ONLY required for Einzelfirma
      if (formData.companyLegalForm === "einzelfirma") {
        if (!formData.personalAddress.trim()) {
          newErrors.personalAddress = "Persönliche Adresse ist für Einzelfirma erforderlich";
        }
        if (!formData.personalZip.trim()) {
          newErrors.personalZip = "PLZ ist erforderlich";
        }
        if (!formData.personalCity.trim()) {
          newErrors.personalCity = "Ort ist erforderlich";
        }
        if (!formData.personalCanton) {
          newErrors.personalCanton = "Kanton ist erforderlich";
        }
      }
      // For other legal forms (GmbH, AG, etc.), personal address is OPTIONAL
    } else if (step === 3) {
      // Business Address validation depends on legal form
      if (formData.companyLegalForm !== "einzelfirma") {
        // For GmbH, AG, etc: Business address is REQUIRED
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
      } else {
        // For Einzelfirma: Business address is OPTIONAL (personal is already required)
        // Only validate if user chose NOT to use personal address AND started filling it
        if (!formData.sameAsPersonal && formData.businessAddress.trim()) {
          // If they start filling it, validate properly
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
      }
      
      // Banking validation - same for all
      if (!formData.iban) {
        newErrors.iban = "IBAN ist erforderlich";
      } else if (!validateIBAN(formData.iban)) {
        newErrors.iban = "Ungültige IBAN. Format: CH## #### #### #### #### #";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bankname ist erforderlich";
      }
    } else if (step === 4) {
      // Insurance is completely optional - no validation required
      // Users are informed via UI that it's needed for activation
    } else if (step === 5) {
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
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
      // Guest registration - no authentication required
      // User account will be created by admin upon approval

      // Use personal address for business if same address is selected
      let businessAddress = formData.businessAddress;
      let businessZip = formData.businessZip;
      let businessCity = formData.businessCity;
      let businessCanton = formData.businessCanton;

      if (formData.sameAsPersonal) {
        businessAddress = formData.personalAddress;
        businessZip = formData.personalZip;
        businessCity = formData.personalCity;
        businessCanton = formData.personalCanton;
      }

      // Collect all uploaded files
      const allUploads = {
        uidCertificate: uploadedFiles.uidCertificate,
        insuranceDocument: uploadedFiles.insuranceDocument,
        tradeLicense: uploadedFiles.tradeLicense,
      };

      // Upload files to Supabase storage and collect URLs
      const verificationDocuments: string[] = [];
      const tempUserId = crypto.randomUUID(); // Temporary ID for file organization
      
      for (const [type, file] of Object.entries(allUploads)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `pending/${tempUserId}/${type}-${Date.now()}.${fileExt}`;
          
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

      // Insert handwerker_profile for guest registration (no user_id)
      const { error } = await supabase
        .from("handwerker_profiles")
        .insert([{
          user_id: null, // Will be set by admin upon approval
          // Personal Information
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
          email: formData.email || null,
          phone_number: formData.phoneNumber || null,
          personal_address: formData.personalAddress || null,
          personal_zip: formData.personalZip || null,
          personal_city: formData.personalCity || null,
          personal_canton: formData.personalCanton || null,
          // Company Information
          company_name: formData.companyName || null,
          company_legal_form: formData.companyLegalForm || null,
          uid_number: formData.uidNumber || null,
          mwst_number: formData.mwstNumber || null,
          // Business Address
          business_address: businessAddress || null,
          business_zip: businessZip || null,
          business_city: businessCity || null,
          business_canton: businessCanton || null,
          // Banking
          iban: formData.iban.replace(/\s/g, "") || null,
          bank_name: formData.bankName || null,
          // Insurance & Licenses
          liability_insurance_provider: formData.liabilityInsuranceProvider,
          liability_insurance_policy_number: formData.policyNumber || null,
          trade_license_number: formData.tradeLicenseNumber || null,
          insurance_valid_until: formData.insuranceValidUntil,
          // Service Details
          bio: formData.bio || null,
          categories: formData.categories as any[],
          service_areas: formData.serviceAreas.length > 0 ? formData.serviceAreas : [],
          hourly_rate_min: formData.hourlyRateMin ? parseInt(formData.hourlyRateMin) : null,
          hourly_rate_max: formData.hourlyRateMax ? parseInt(formData.hourlyRateMax) : null,
          // Verification
          verification_documents: verificationDocuments,
          verification_status: 'pending',
          is_verified: false,
        }]);

      if (error) throw error;

      console.log('Profile created successfully, sending admin notification...');

      // Trigger admin notification email
      try {
        const { error: notifyError } = await supabase.functions.invoke(
          'send-admin-registration-notification',
          {
            body: {
              profileId: error ? null : 'pending', // Will be handled by the trigger
            },
          }
        );

        if (notifyError) {
          console.error('Failed to send admin notification:', notifyError);
        }
      } catch (notifyErr) {
        console.error('Admin notification error:', notifyErr);
      }

      toast({
        title: "Registrierung erfolgreich",
        description: "Vielen Dank! Wir überprüfen Ihre Angaben und senden Ihnen innerhalb von 1-2 Werktagen Ihre Zugangsdaten per E-Mail.",
        duration: 10000,
      });

      // Clear saved draft
      localStorage.removeItem('handwerker-onboarding-draft');

      navigate("/");
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
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Firmeninformationen</h3>
                <p className="text-base text-muted-foreground">Grundlegende Angaben zu Ihrem Betrieb</p>
              </div>
            </div>

            <Alert className="border-brand-300 bg-brand-50 mb-6">
              <AlertCircle className="h-5 w-5 text-brand-600" />
              <AlertDescription className="text-base ml-2">
                <span className="font-semibold text-brand-700">Hinweis:</span>
                {" "}Felder mit <span className="text-brand-600">★</span> sind für die Aktivierung 
                Ihres Kontos erforderlich, können aber später nachgereicht werden.
              </AlertDescription>
            </Alert>

            <div className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-base font-medium">Firmenname *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="z.B. Muster AG"
                  className="h-12 text-base"
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="companyLegalForm" className="text-base font-medium">Rechtsform *</Label>
                <Select
                  value={formData.companyLegalForm}
                  onValueChange={(value) => setFormData({ ...formData, companyLegalForm: value })}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einzelfirma">Einzelfirma</SelectItem>
                    <SelectItem value="gmbh">GmbH</SelectItem>
                    <SelectItem value="ag">AG</SelectItem>
                    <SelectItem value="kollektivgesellschaft">Kollektivgesellschaft</SelectItem>
                    <SelectItem value="kommanditgesellschaft">Kommanditgesellschaft</SelectItem>
                    <SelectItem value="genossenschaft">Genossenschaft</SelectItem>
                    <SelectItem value="verein">Verein</SelectItem>
                    <SelectItem value="stiftung">Stiftung</SelectItem>
                  </SelectContent>
                </Select>
                {errors.companyLegalForm && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.companyLegalForm}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="uidNumber" className="text-base font-medium">
                  UID-Nummer
                  <span className="text-brand-600 ml-1" title="Für Aktivierung erforderlich">★</span>
                </Label>
                <Input
                  id="uidNumber"
                  value={formData.uidNumber}
                  onChange={(e) => setFormData({ ...formData, uidNumber: e.target.value })}
                  onBlur={(e) => {
                    const formatted = formatUID(e.target.value);
                    setFormData({ ...formData, uidNumber: formatted });
                  }}
                  placeholder="CHE-123.456.789"
                  className="h-12 text-base font-mono"
                />
                {errors.uidNumber && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.uidNumber}
                  </p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="text-brand-600">★</span>
                  Für die Aktivierung Ihres Kontos benötigt
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="mwstNumber" className="text-base font-medium">MWST-Nummer (optional)</Label>
                <Input
                  id="mwstNumber"
                  value={formData.mwstNumber}
                  onChange={(e) => setFormData({ ...formData, mwstNumber: e.target.value })}
                  placeholder="CHE-123.456.789 MWST"
                  className="h-12 text-base font-mono"
                />
                {errors.mwstNumber && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.mwstNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Persönliche Informationen</h3>
                <p className="text-base text-muted-foreground">Ihre Kontaktdaten als Ansprechperson</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-medium">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Max"
                    className="h-12 text-base"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-medium">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Muster"
                    className="h-12 text-base"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-medium">E-Mail-Adresse *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  placeholder="max.muster@beispiel.ch"
                  className="h-12 text-base"
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="phoneNumber" className="text-base font-medium">Telefonnummer *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+41 79 123 45 67"
                  className="h-12 text-base"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phoneNumber}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Format: +41 79 123 45 67</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="personalAddress" className="text-base font-medium">
                  Adresse {formData.companyLegalForm === "einzelfirma" && "*"}
                </Label>
                <Input
                  id="personalAddress"
                  value={formData.personalAddress}
                  onChange={(e) => setFormData({ ...formData, personalAddress: e.target.value })}
                  placeholder="Musterstrasse 123"
                  className="h-12 text-base"
                />
                {errors.personalAddress && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.personalAddress}
                  </p>
                )}
                {formData.companyLegalForm === "einzelfirma" ? (
                  <p className="text-xs text-muted-foreground">
                    Für Einzelfirma ist die persönliche Adresse erforderlich
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Optional - Die Geschäftsadresse wird in Schritt 3 abgefragt
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="personalZip" className="text-base font-medium">
                    PLZ {formData.companyLegalForm === "einzelfirma" && "*"}
                  </Label>
                  <Input
                    id="personalZip"
                    value={formData.personalZip}
                    onChange={(e) => setFormData({ ...formData, personalZip: e.target.value })}
                    placeholder="8000"
                    maxLength={4}
                    className="h-12 text-base"
                  />
                  {errors.personalZip && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.personalZip}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="personalCity" className="text-base font-medium">
                    Ort {formData.companyLegalForm === "einzelfirma" && "*"}
                  </Label>
                  <Input
                    id="personalCity"
                    value={formData.personalCity}
                    onChange={(e) => setFormData({ ...formData, personalCity: e.target.value })}
                    placeholder="Zürich"
                    className="h-12 text-base"
                  />
                  {errors.personalCity && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.personalCity}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="personalCanton" className="text-base font-medium">
                  Kanton {formData.companyLegalForm === "einzelfirma" && "*"}
                </Label>
                <Select
                  value={formData.personalCanton}
                  onValueChange={(value) => setFormData({ ...formData, personalCanton: value })}
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
                {errors.personalCanton && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.personalCanton}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
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

            {formData.companyLegalForm === "einzelfirma" ? (
              <Alert className="border-brand-300 bg-brand-50">
                <AlertCircle className="h-5 w-5 text-brand-600" />
                <AlertDescription className="text-base ml-2">
                  Für Einzelfirma ist die Geschäftsadresse optional. Sie können die persönliche Adresse aus Schritt 2 verwenden.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-brand-300 bg-brand-50">
                <AlertCircle className="h-5 w-5 text-brand-600" />
                <AlertDescription className="text-base ml-2">
                  Die Geschäftsadresse Ihrer Firma ist erforderlich.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="sameAsPersonal"
                checked={formData.sameAsPersonal}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({ 
                      ...formData, 
                      sameAsPersonal: true,
                      businessAddress: formData.personalAddress,
                      businessZip: formData.personalZip,
                      businessCity: formData.personalCity,
                      businessCanton: formData.personalCanton,
                    });
                  } else {
                    setFormData({ ...formData, sameAsPersonal: false });
                  }
                }}
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

      case 4:
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

            <Alert className="border-brand-300 bg-brand-50 mb-6">
              <AlertCircle className="h-5 w-5 text-brand-600" />
              <AlertDescription className="text-base ml-2">
                <span className="font-semibold text-brand-700">Hinweis:</span>
                {" "}Versicherungsinformationen mit <span className="text-brand-600">★</span> sind für 
                die Aktivierung erforderlich, können aber später ergänzt werden.
              </AlertDescription>
            </Alert>

            <div className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="liabilityInsuranceProvider" className="text-base font-medium">
                  Haftpflichtversicherung
                  <span className="text-brand-600 ml-1" title="Für Aktivierung erforderlich">★</span>
                </Label>
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
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="text-brand-600">★</span>
                  Für die Aktivierung Ihres Kontos benötigt
                </p>
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
                <Label htmlFor="insuranceValidUntil" className="text-base font-medium">
                  Gültig bis
                  <span className="text-brand-600 ml-1" title="Für Aktivierung erforderlich">★</span>
                </Label>
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
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="text-brand-600">★</span>
                  Für die Aktivierung Ihres Kontos benötigt
                </p>
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

      case 5:
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

            {/* Service Areas */}
            <Card className="border-2 mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Einsatzgebiete (PLZ) <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  Geben Sie Postleitzahlen ein, in denen Sie arbeiten. Sie erhalten nur Benachrichtigungen für Anfragen in diesen Gebieten.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.serviceAreas && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.serviceAreas}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Postleitzahlen eingeben
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Einzelne PLZ: 8000, 8001, 9000 | Bereiche: 8000-8099 | Drücken Sie Enter oder Komma zum Hinzufügen
                  </p>
                  <Input
                    placeholder="z.B. 8000, 8001-8099, 9000"
                    value={serviceAreaInput}
                    onChange={(e) => setServiceAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const value = serviceAreaInput.trim();
                        
                        if (value) {
                          // Parse PLZ input
                          const parts = value.split(',').map(p => p.trim()).filter(p => p);
                          const validAreas: string[] = [];
                          
                          for (const part of parts) {
                            // Range: 8000-8099
                            if (part.includes('-')) {
                              const [start, end] = part.split('-').map(p => p.trim());
                              const startNum = parseInt(start);
                              const endNum = parseInt(end);
                              
                              if (/^\d{4}$/.test(start) && /^\d{4}$/.test(end) && 
                                  startNum >= 1000 && startNum <= 9999 &&
                                  endNum >= 1000 && endNum <= 9999 &&
                                  startNum <= endNum) {
                                 validAreas.push(part);
                               } else {
                                 toast({ title: "Fehler", description: `Ungültiger Bereich: ${part}`, variant: "destructive" });
                               }
                            }
                            // Single PLZ: 8000
                            else if (/^\d{4}$/.test(part)) {
                              const num = parseInt(part);
                              if (num >= 1000 && num <= 9999) {
                                 validAreas.push(part);
                               } else {
                                 toast({ title: "Fehler", description: `Ungültige PLZ: ${part}`, variant: "destructive" });
                               }
                             } else {
                               toast({ title: "Fehler", description: `Ungültige Eingabe: ${part}`, variant: "destructive" });
                             }
                          }
                          
                          if (validAreas.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: [...new Set([...prev.serviceAreas, ...validAreas])]
                            }));
                            setServiceAreaInput('');
                            if (errors.serviceAreas) {
                              setErrors(prev => ({ ...prev, serviceAreas: '' }));
                            }
                          }
                        }
                      }
                    }}
                    className="h-12 text-base"
                  />
                </div>

                {formData.serviceAreas.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Ausgewählte Einsatzgebiete ({formData.serviceAreas.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[80px]">
                      {formData.serviceAreas.map((area, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="px-3 py-2 text-sm font-medium cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          {area}
                          <X 
                            className="ml-2 h-3 w-3" 
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
                              }));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Area Map Preview */}
                {formData.serviceAreas.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <Label className="text-base font-medium">
                      Kartenvorschau Ihrer Einsatzgebiete
                    </Label>
                    <ServiceAreaMap serviceAreas={formData.serviceAreas} />
                  </div>
                )}
              </CardContent>
            </Card>

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

      case 6:
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

              {/* 2. Personal Information */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Persönliche Informationen</CardTitle>
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
                  <SummaryItem label="Name" value={`${formData.firstName} ${formData.lastName}`} />
                  <SummaryItem label="E-Mail" value={formData.email} />
                  <SummaryItem label="Telefon" value={formData.phoneNumber} />
                  {formData.personalAddress && (
                    <SummaryItem 
                      label="Adresse" 
                      value={`${formData.personalAddress}, ${formData.personalZip} ${formData.personalCity}, ${formData.personalCanton}`} 
                    />
                  )}
                </CardContent>
              </Card>

              {/* 3. Banking Information */}
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
                      onClick={() => setCurrentStep(3)}
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

              {/* 4. Insurance & Licenses */}
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
                      onClick={() => setCurrentStep(4)}
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

              {/* 5. Service Details */}
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
                      onClick={() => setCurrentStep(5)}
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

              {/* 6. Uploaded Documents */}
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
                    file={uploadedFiles.uidCertificate}
                  />
                  <DocumentStatus 
                    label="Versicherungsnachweis" 
                    file={uploadedFiles.insuranceDocument}
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container max-w-3xl mx-auto px-4">
        {/* Visual Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => {
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;
                const stepLabels = ['Firma', 'Person', 'Adresse', 'Versicherung', 'Fachgebiete', 'Prüfung'];
              
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground shadow-lg scale-110",
                    isCurrent && "bg-brand-500 text-white shadow-xl scale-125 ring-4 ring-brand-200",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : step}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 font-medium text-center",
                    isCurrent && "text-brand-600 font-bold",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}>
                    {stepLabels[step - 1]}
                  </p>
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
                  Schritt {currentStep} von 6
                </CardDescription>
              </div>
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  Zuletzt gespeichert: {lastSaved.toLocaleTimeString('de-CH')}
                </p>
              )}
            </div>
            {localStorage.getItem('handwerker-onboarding-draft') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('handwerker-onboarding-draft');
                  toast({
                    title: "Entwurf gelöscht",
                    description: "Ihre gespeicherten Daten wurden entfernt.",
                  });
                  window.location.reload();
                }}
                className="text-xs text-muted-foreground hover:text-destructive mt-2"
              >
                Entwurf löschen
              </Button>
            )}
            <div className="flex items-center justify-between mt-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {Math.round(progress)}% fertig
              </Badge>
            </div>
            <Progress value={progress} className="mt-4 h-2" />
          </CardHeader>

          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>

          <CardFooter className="flex gap-4 pt-6 border-t">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-12 px-6 text-base flex-1"
                disabled={isLoading}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Zurück
              </Button>
            )}
            
              {currentStep < 6 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-12 px-6 text-base flex-1"
                  disabled={isLoading}
                >
                  {currentStep === 5 ? "Weiter zur Zusammenfassung" : "Weiter"}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              )}
              
              {currentStep === 6 && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="h-12 px-6 text-base flex-1 bg-brand-600 hover:bg-brand-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Bestätigen & Profil einreichen
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Recovery Dialog */}
        <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl">Willkommen zurück!</AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-1">
                    Wir haben Ihren Fortschritt gespeichert
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            {recoveryData && (
              <div className="space-y-4 py-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Fortschritt</p>
                    <p className="text-sm font-bold text-brand-600">{Math.round(recoveryData.progress)}%</p>
                  </div>
                  <Progress value={recoveryData.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Schritt {recoveryData.currentStep} von {recoveryData.totalSteps} abgeschlossen
                  </p>
                </div>

                {/* Last Save Time */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Zuletzt bearbeitet</p>
                    <p className="text-sm font-medium">{recoveryData.lastSaveTime}</p>
                  </div>
                </div>

                {/* Info */}
                <Alert className="border-brand-300 bg-brand-50">
                  <CheckCircle className="h-4 w-4 text-brand-600" />
                  <AlertDescription className="text-sm ml-2">
                    Ihre Daten werden automatisch gespeichert und bleiben 7 Tage verfügbar.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  // Start fresh - clear everything
                  localStorage.removeItem('handwerker-onboarding-draft');
                  sessionStorage.removeItem('pending-recovery-data');
                  setShowRecoveryDialog(false);
                  toast({
                    title: "Neu gestartet",
                    description: "Das Formular wurde zurückgesetzt.",
                  });
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Neu beginnen
              </Button>
              <Button
                onClick={() => {
                  // Load the saved data
                  const pendingData = sessionStorage.getItem('pending-recovery-data');
                  if (pendingData) {
                    const parsed = JSON.parse(pendingData);
                    setCurrentStep(parsed.currentStep || 1);
                    setFormData(parsed.formData || formData);
                    setSelectedMajorCategories(parsed.selectedMajorCategories || []);
                    sessionStorage.removeItem('pending-recovery-data');
                  }
                  setShowRecoveryDialog(false);
                  toast({
                    title: "Fortschritt wiederhergestellt",
                    description: `Sie befinden sich jetzt bei Schritt ${recoveryData?.currentStep}.`,
                    duration: 3000,
                  });
                }}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700"
              >
                Fortfahren
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerOnboarding;
