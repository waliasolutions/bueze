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
import { AlertCircle, Building2, Wallet, Shield, Briefcase, X, Upload, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight, Loader2, User, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { majorCategories } from "@/config/majorCategories";
import { subcategoryLabels } from "@/config/subcategoryLabels";
import { cn } from "@/lib/utils";
import { PostalCodeInput } from "@/components/PostalCodeInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  cantonToPostalCodes, 
  calculatePostalCodeCount,
  formatCantonDisplay,
  getCantonFromPostalCode 
} from "@/lib/cantonPostalCodes";
import { 
  saveVersionedData, 
  loadVersionedData, 
  clearVersionedData,
  STORAGE_KEYS,
  STORAGE_VERSIONS 
} from "@/lib/localStorageVersioning";

const HandwerkerOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyAuthenticated, setIsAlreadyAuthenticated] = useState(false);
  const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedCantons, setSelectedCantons] = useState<string[]>([]);
  const [manualPostalCodes, setManualPostalCodes] = useState<string[]>([]);
  const [tempPostalCode, setTempPostalCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{
    insuranceDocument?: { name: string; uploadedAt: string; path: string };
    tradeLicense?: { name: string; uploadedAt: string; path: string };
    logo?: { name: string; uploadedAt: string; path: string };
  }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    insuranceDocument?: string;
    tradeLicense?: string;
    logo?: string;
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Helper to mark a field as touched
  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Helper to check if an error should be shown (only if field is touched)
  const shouldShowError = (field: string) => {
    return touched[field] && errors[field];
  };

  const totalSteps = 5;

  // Helper function to update formData.serviceAreas from cantons + manual codes
  const updateFormDataServiceAreas = (cantons: string[], manualCodes: string[]) => {
    const allAreas = [...cantons, ...manualCodes];
    setFormData(prev => ({ ...prev, serviceAreas: allAreas }));
  };

  // Toggle canton selection
  const toggleCanton = (canton: string) => {
    setSelectedCantons(prev => {
      const isSelected = prev.includes(canton);
      const newSelection = isSelected 
        ? prev.filter(c => c !== canton)
        : [...prev, canton];
      
      updateFormDataServiceAreas(newSelection, manualPostalCodes);
      
      return newSelection;
    });
  };

  // Remove canton
  const removeCanton = (canton: string) => {
    setSelectedCantons(prev => {
      const newSelection = prev.filter(c => c !== canton);
      updateFormDataServiceAreas(newSelection, manualPostalCodes);
      
      return newSelection;
    });
  };

  // Add manual postal code
  const addManualPostalCode = (postalCode: string) => {
    const coveringCanton = selectedCantons.find(canton => {
      const ranges = cantonToPostalCodes(canton);
      return ranges.some(range => {
        const [start, end] = range.split('-').map(Number);
        const code = parseInt(postalCode);
        return code >= start && code <= end;
      });
    });

    if (coveringCanton) {
      toast({
        title: "Bereits abgedeckt",
        description: `PLZ ${postalCode} ist bereits durch Kanton ${coveringCanton} abgedeckt`,
        variant: "destructive",
      });
      return;
    }

    if (manualPostalCodes.includes(postalCode)) {
      toast({
        title: "Bereits vorhanden",
        description: `PLZ ${postalCode} ist bereits in Ihren Servicegebieten`,
        variant: "destructive",
      });
      return;
    }

    setManualPostalCodes(prev => {
      const newCodes = [...prev, postalCode];
      updateFormDataServiceAreas(selectedCantons, newCodes);
      return newCodes;
    });
    
    setTempPostalCode('');
  };

  // Remove manual postal code
  const removeManualPostalCode = (postalCode: string) => {
    setManualPostalCodes(prev => {
      const newCodes = prev.filter(code => code !== postalCode);
      updateFormDataServiceAreas(selectedCantons, newCodes);
      return newCodes;
    });
  };
  const progress = ((currentStep - 1) / totalSteps) * 100;

  // Check if user is already logged in and handle accordingly
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is logged in
        const { data: existingProfile } = await supabase
          .from('handwerker_profiles')
          .select('id, verification_status')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (existingProfile) {
          // Already has profile - redirect to dashboard
          toast({
            title: "Profil bereits vorhanden",
            description: "Sie haben bereits ein Handwerker-Profil.",
          });
          navigate('/handwerker-dashboard');
          return;
        }
        
        // User is logged in but has no profile - pre-fill from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        const nameParts = (profile?.full_name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          email: session.user.email || profile?.email || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phoneNumber: profile?.phone || '',
        }));
        
        // Set flag that user is already authenticated
        setIsAlreadyAuthenticated(true);
      }
    };
    
    checkAuthStatus();
  }, [navigate, toast]);

  // Parse serviceAreas into cantons and manual postal codes when data is loaded
  useEffect(() => {
    if (formData.serviceAreas.length > 0) {
      const cantons: string[] = [];
      const manualCodes: string[] = [];
      
      formData.serviceAreas.forEach(area => {
        // Check if it's a 2-letter canton code (uppercase)
        if (area.length === 2 && area === area.toUpperCase() && /^[A-Z]{2}$/.test(area)) {
          cantons.push(area);
        } else {
          manualCodes.push(area);
        }
      });
      
      setSelectedCantons(cantons);
      setManualPostalCodes(manualCodes);
    }
  }, [formData.serviceAreas]);

  // Helper function to check if form has meaningful progress
  const hasSignificantProgress = () => {
    // If beyond step 1, there's progress
    if (currentStep > 1) return true;
    
    // Check if any critical fields are filled
    const hasFilledFields = 
      formData.companyName.trim() !== "" ||
      formData.firstName.trim() !== "" ||
      formData.lastName.trim() !== "" ||
      formData.email.trim() !== "";
    
    // Check if any categories selected
    const hasSelectedCategories = selectedMajorCategories.length > 0;
    
    return hasFilledFields || hasSelectedCategories;
  };

  // Auto-save form data to localStorage with versioning
  useEffect(() => {
    const saveToLocalStorage = () => {
      // Only save if there's meaningful progress
      if (!hasSignificantProgress()) {
        return;
      }
      
      const dataToSave = {
        currentStep,
        formData,
        selectedMajorCategories,
        uploadedFiles,
      };
      saveVersionedData(
        STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT,
        dataToSave,
        STORAGE_VERSIONS.HANDWERKER_ONBOARDING_DRAFT
      );
      setLastSaved(new Date());
    };

    const timeoutId = setTimeout(saveToLocalStorage, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentStep, formData, selectedMajorCategories]);

  // Load saved form data from localStorage on mount with versioning
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const { data, wasRecovered, lastSaved: savedAt } = loadVersionedData<{
        currentStep: number;
        formData: typeof formData;
        selectedMajorCategories: string[];
        uploadedFiles: typeof uploadedFiles;
      }>({
        key: STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT,
        currentVersion: STORAGE_VERSIONS.HANDWERKER_ONBOARDING_DRAFT,
        ttlHours: 168, // 7 days
        migrations: {
          // Migration from version 1 to 2: Handle any schema changes
          2: (oldData: unknown) => oldData, // No schema changes yet
        },
      });

      if (wasRecovered && data && savedAt) {
        // Calculate progress
        const savedProgress = Math.min(((data.currentStep - 1) / 5) * 100, 100);
        
        // Format last save time
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let lastSaveTimeStr;
        if (diffDays === 0) {
          lastSaveTimeStr = `Heute um ${savedAt.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
          lastSaveTimeStr = `Gestern um ${savedAt.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          lastSaveTimeStr = savedAt.toLocaleDateString('de-CH', { 
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
          currentStep: data.currentStep,
          totalSteps: 5,
        });
        setShowRecoveryDialog(true);
        
        // Store the parsed data temporarily (don't load yet)
        sessionStorage.setItem('pending-recovery-data', JSON.stringify(data));
      }
    };

    loadFromLocalStorage();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Company Information validation - minimal requirements
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Firmenname ist erforderlich";
      } else if (formData.companyName.trim().length < 2) {
        newErrors.companyName = "Firmenname muss mindestens 2 Zeichen lang sein";
      }
      // UID and MWST are optional, only validate format if provided
      if (formData.uidNumber && formData.uidNumber.trim() && !validateUID(formData.uidNumber)) {
        newErrors.uidNumber = "Ungültiges Format. Beispiel: CHE-123.456.789";
      }
      if (formData.mwstNumber && formData.mwstNumber.trim() && !validateMWST(formData.mwstNumber)) {
        newErrors.mwstNumber = "Ungültiges Format. Beispiel: CHE-123.456.789 MWST";
      }
    } else if (step === 2) {
      // Personal Information validation - only name, email, phone required
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Vorname ist erforderlich";
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = "Vorname muss mindestens 2 Zeichen lang sein";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Nachname ist erforderlich";
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = "Nachname muss mindestens 2 Zeichen lang sein";
      }
      if (!formData.email.trim()) {
        newErrors.email = "E-Mail-Adresse ist erforderlich";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Ungültige E-Mail-Adresse";
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Telefonnummer ist erforderlich";
      }
      
      // Personal address is now optional for all legal forms
    } else if (step === 3) {
      // Business address and banking are now completely optional
      // Only validate format if provided
      if (formData.iban && formData.iban.trim() && !validateIBAN(formData.iban)) {
        newErrors.iban = "Ungültige IBAN. Format: CH## #### #### #### #### #";
      }
    } else if (step === 4) {
      // Insurance is completely optional - no validation required
    } else if (step === 5) {
      // Categories and subcategories are completely optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Mark all fields in current step as touched before validation
    if (currentStep === 1) {
      setTouched(prev => ({ ...prev, companyName: true, companyLegalForm: true, uidNumber: true, mwstNumber: true }));
    } else if (currentStep === 2) {
      setTouched(prev => ({ ...prev, firstName: true, lastName: true, email: true, phoneNumber: true, personalAddress: true, personalZip: true, personalCity: true, personalCanton: true }));
    } else if (currentStep === 3) {
      setTouched(prev => ({ ...prev, iban: true, bankName: true, businessAddress: true, businessZip: true, businessCity: true, businessCanton: true }));
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (file: File, type: 'insuranceDocument' | 'tradeLicense' | 'logo') => {
    try {
      // Validate file size (max 10MB for documents, 5MB for logos)
      const MAX_FILE_SIZE = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Datei zu groß",
          description: type === 'logo' 
            ? "Das Logo darf maximal 5MB groß sein."
            : "Die Datei darf maximal 10MB groß sein.",
          variant: "destructive",
        });
        return;
      }

      // Validate logo file type
      if (type === 'logo' && !file.type.startsWith('image/')) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte laden Sie eine Bilddatei hoch (JPG, PNG, SVG, WebP).",
          variant: "destructive",
        });
        return;
      }

      // Generate or reuse temporary ID for organizing uploads
      let tempId = sessionStorage.getItem('handwerker-upload-temp-id');
      if (!tempId) {
        tempId = crypto.randomUUID();
        sessionStorage.setItem('handwerker-upload-temp-id', tempId);
      }

      const fileExt = file.name.split('.').pop();
      // Use logos folder for logo uploads
      const folder = type === 'logo' ? 'logos' : 'pending';
      const fileName = type === 'logo' 
        ? `${folder}/pending/${type}-${Date.now()}.${fileExt}`
        : `${folder}/${tempId}/${type}-${Date.now()}.${fileExt}`;
      
      setUploadProgress(prev => ({ ...prev, [type]: 'uploading' }));

      const { error: uploadError } = await supabase.storage
        .from('handwerker-documents')
        .upload(fileName, file);

      if (uploadError) {
        if (import.meta.env.DEV) console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      setUploadProgress(prev => ({ ...prev, [type]: 'success' }));
      setUploadedFiles(prev => ({ 
        ...prev, 
        [type]: {
          name: file.name,
          uploadedAt: new Date().toISOString(),
          path: fileName
        }
      }));

      toast({
        title: "Dokument hochgeladen",
        description: `${file.name} wurde erfolgreich hochgeladen.`,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Dokument konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    
    if (import.meta.env.DEV) {
      console.log('=== HANDWERKER REGISTRATION START ===');
      console.log('Current timestamp:', new Date().toISOString());
    }
    
    try {
      if (import.meta.env.DEV) console.log('Form data:', { categories: formData.categories, serviceAreas: formData.serviceAreas });
      
      let userId: string;
      let userEmail: string;
      let tempPassword: string | null = null;
      
      if (isAlreadyAuthenticated) {
        // User is already logged in - use their existing auth account
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('Session expired. Please log in again.');
        }
        userId = session.user.id;
        userEmail = session.user.email!;
        
        if (import.meta.env.DEV) console.log('Using existing auth account:', userId);
      } else {
        // Normalize email before checking and signup
        const normalizedEmail = formData.email.toLowerCase().trim();
        
        // Check if email already exists in profiles table before attempting signup
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        
        if (existingProfile) {
          toast({
            title: 'E-Mail bereits registriert',
            description: 'Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
        
        // Create new auth account
        tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!';
        if (import.meta.env.DEV) console.log('Generated temporary password');

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: tempPassword,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              full_name: `${formData.firstName} ${formData.lastName}`,
              role: 'handwerker',
            },
            emailRedirectTo: `${window.location.origin}/handwerker-dashboard`,
          }
        });

        if (authError) {
          if (import.meta.env.DEV) console.error('Auth account creation error:', authError);
          
          // Handle user already exists error
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
            toast({
              title: 'E-Mail bereits registriert',
              description: 'Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.',
              variant: 'destructive',
            });
            setTimeout(() => navigate('/auth'), 2000);
            return;
          }
          
          throw new Error(`Konto konnte nicht erstellt werden: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Konto wurde erstellt, aber keine Benutzer-ID erhalten');
        }

        userId = authData.user.id;
        userEmail = formData.email;
        
        if (import.meta.env.DEV) console.log('Auth account created successfully:', userId);

        // Explicitly sign in to ensure session is established for RLS
        if (import.meta.env.DEV) console.log('Signing in to establish session...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: tempPassword,
        });

        if (signInError) {
          if (import.meta.env.DEV) console.error('SignIn error after signup:', signInError);
          throw new Error('Anmeldung nach Registrierung fehlgeschlagen');
        }

        if (import.meta.env.DEV) console.log('User signed in successfully');
      }

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
        insuranceDocument: uploadedFiles.insuranceDocument,
        tradeLicense: uploadedFiles.tradeLicense,
        logo: uploadedFiles.logo,
      };

      // Upload files to Supabase storage and collect URLs
      const verificationDocuments: string[] = [];
      let logoUrl: string | null = null;
      
      for (const [type, fileMetadata] of Object.entries(allUploads)) {
        if (fileMetadata && fileMetadata.path) {
          // File was already uploaded, just get the public URL
          const { data } = supabase.storage
            .from('handwerker-documents')
            .getPublicUrl(fileMetadata.path);
          
          if (data?.publicUrl) {
            if (type === 'logo') {
              logoUrl = data.publicUrl;
            } else {
              verificationDocuments.push(data.publicUrl);
            }
          }
        }
      }

      // Prepare insert data with safe defaults and null handling
      const insertData = {
        user_id: userId, // Link to auth user (existing or new)
        // Personal Information - trim and convert empty to null
        first_name: formData.firstName?.trim() || null,
        last_name: formData.lastName?.trim() || null,
        email: formData.email?.trim() || null,
        phone_number: formData.phoneNumber?.trim() || null,
        personal_address: formData.personalAddress?.trim() || null,
        personal_zip: formData.personalZip?.trim() || null,
        personal_city: formData.personalCity?.trim() || null,
        personal_canton: formData.personalCanton?.trim() || null,
        // Company Information
        company_name: formData.companyName?.trim() || null,
        company_legal_form: formData.companyLegalForm?.trim() || null,
        uid_number: formData.uidNumber?.trim() || null,
        mwst_number: formData.mwstNumber?.trim() || null,
        // Business Address
        business_address: businessAddress?.trim() || null,
        business_zip: businessZip?.trim() || null,
        business_city: businessCity?.trim() || null,
        business_canton: businessCanton?.trim() || null,
        // Banking (optional)
        iban: formData.iban?.trim() ? formData.iban.replace(/\s/g, "") : null,
        bank_name: formData.bankName?.trim() || null,
        // Insurance & Licenses
        liability_insurance_provider: formData.liabilityInsuranceProvider?.trim() || null,
        liability_insurance_policy_number: formData.policyNumber?.trim() || null,
        trade_license_number: formData.tradeLicenseNumber?.trim() || null,
        insurance_valid_until: formData.insuranceValidUntil?.trim() || null,
        // Service Details
        bio: formData.bio?.trim() || null,
        // Fix: Ensure categories array is properly handled with safe default
        categories: (Array.isArray(formData.categories) && formData.categories.length > 0) 
          ? formData.categories 
          : [] as any,
        // Ensure service_areas has safe default empty array
        service_areas: (Array.isArray(formData.serviceAreas) && formData.serviceAreas.length > 0) 
          ? formData.serviceAreas 
          : [],
        hourly_rate_min: formData.hourlyRateMin?.trim() ? parseInt(formData.hourlyRateMin) : null,
        hourly_rate_max: formData.hourlyRateMax?.trim() ? parseInt(formData.hourlyRateMax) : null,
        // Verification - ensure array defaults
        verification_documents: verificationDocuments.length > 0 ? verificationDocuments : [],
        verification_status: 'pending',
        is_verified: false,
        logo_url: logoUrl,
      };

      if (import.meta.env.DEV) {
        console.log('Insert data prepared:', {
          user_id: insertData.user_id,
          email: insertData.email,
          categories: insertData.categories,
          service_areas: insertData.service_areas,
          verification_status: insertData.verification_status
        });
      }

      // Insert handwerker_profile with user_id
      if (import.meta.env.DEV) {
        console.log('Attempting database insert...');
        console.log('Insert data:', JSON.stringify(insertData, null, 2));
      }
      
      const insertPromise = supabase
        .from("handwerker_profiles")
        .insert([insertData])
        .select()
        .single();

      // Add timeout to detect hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database insert timeout after 15 seconds')), 15000)
      );

      const { data: profileData, error } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]).catch(err => {
        if (import.meta.env.DEV) console.error('Insert promise failed:', err);
        return { data: null, error: err };
      }) as any;

      if (import.meta.env.DEV) {
        console.log('Insert result - error:', error);
        console.log('Insert result - data:', profileData);
      }

      if (error) {
        if (import.meta.env.DEV) {
          console.error('=== DATABASE INSERT ERROR ===');
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
        }
        
        // More user-friendly error messages
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Berechtigungsfehler: Profil konnte nicht erstellt werden. Bitte kontaktieren Sie den Support.');
        }
        throw error;
      }
      if (!profileData) {
        if (import.meta.env.DEV) console.error('=== PROFILE DATA IS NULL ===');
        throw new Error('Failed to create profile');
      }

      if (import.meta.env.DEV) {
        console.log('=== PROFILE CREATED SUCCESSFULLY ===');
        console.log('Profile ID:', profileData.id);
      }

      // Non-blocking: Send emails in parallel (fire-and-forget for faster UX)
      if (tempPassword) {
        if (import.meta.env.DEV) console.log('Sending credentials email (non-blocking)...');
        supabase.functions.invoke('send-handwerker-credentials', {
          body: { 
            email: userEmail,
            password: tempPassword,
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName
          }
        }).catch(credErr => {
          if (import.meta.env.DEV) console.error('Credentials email error (non-critical):', credErr);
        });
      }

      // Non-blocking: Trigger admin notification email (fire-and-forget)
      if (import.meta.env.DEV) console.log('Sending admin notification (non-blocking)...');
      supabase.functions.invoke('send-admin-registration-notification', {
        body: { profileId: profileData.id }
      }).catch(notifyErr => {
        if (import.meta.env.DEV) console.error('Admin notification error (non-critical):', notifyErr);
      });

      // Clear saved draft
      clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);
      sessionStorage.removeItem('handwerker-upload-temp-id');

      // If user was already logged in, just navigate without signing out
      if (isAlreadyAuthenticated) {
        // Non-blocking: Check if user is admin before upserting handwerker role
        // Admins should NOT get handwerker role added (causes duplicate role issues)
        if (import.meta.env.DEV) console.log('Checking existing roles before role assignment:', userId);
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .then(({ data: existingRoles, error: rolesError }) => {
            if (rolesError) {
              if (import.meta.env.DEV) console.error('Failed to check existing roles:', rolesError);
              return;
            }
            
            // Skip role upsert if user is admin or super_admin
            const isCurrentlyAdmin = existingRoles?.some(r => 
              r.role === 'admin' || r.role === 'super_admin'
            );
            
            if (isCurrentlyAdmin) {
              if (import.meta.env.DEV) console.log('User is admin, skipping handwerker role upsert');
              return;
            }
            
            // Non-admin user: assign handwerker role
            if (import.meta.env.DEV) console.log('Upserting handwerker role for user (non-blocking):', userId);
            supabase
              .from('user_roles')
              .upsert(
                { user_id: userId, role: 'handwerker' },
                { onConflict: 'user_id,role' }
              )
              .then(({ error: roleError }) => {
                if (roleError) {
                  if (import.meta.env.DEV) console.error('Failed to assign handwerker role:', roleError);
                } else {
                  if (import.meta.env.DEV) console.log('Handwerker role assigned successfully');
                }
              });
          });
        
        toast({
          title: "Profil erstellt!",
          description: "Ihr Handwerker-Profil wurde erfolgreich erstellt.",
          duration: 5000,
        });
        if (import.meta.env.DEV) console.log('=== PROFILE CREATION COMPLETE ===');
        navigate("/handwerker-dashboard");
      } else {
        // Sign out the newly created user
        await supabase.auth.signOut();

        toast({
          title: "Registrierung erfolgreich!",
          description: "Ihre Zugangsdaten wurden per E-Mail versandt.",
          duration: 8000,
        });

        if (import.meta.env.DEV) {
          console.log('=== REGISTRATION COMPLETE ===');
          console.log('Navigating to auth page...');
        }
        navigate("/auth?registered=true");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('=== REGISTRATION ERROR ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Full error object:', error);
      }
      
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (import.meta.env.DEV) console.log('=== REGISTRATION PROCESS END ===');
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
    file?: { name: string; uploadedAt: string };
  }

  const DocumentStatus: React.FC<DocumentStatusProps> = ({ label, file }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {file ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">{file.name}</span>
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
                  onBlur={() => markTouched('companyName')}
                  placeholder="z.B. Muster AG"
                  className="h-12 text-base"
                />
                {shouldShowError('companyName') && (
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
                {shouldShowError('companyLegalForm') && (
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
                    markTouched('uidNumber');
                  }}
                  placeholder="CHE-123.456.789"
                  className="h-12 text-base font-mono"
                />
                {shouldShowError('uidNumber') && (
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
                  onBlur={(e) => {
                    const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, mwstNumber: formatted });
                    markTouched('mwstNumber');
                  }}
                  placeholder="CHE-123.456.789 MWST"
                  className="h-12 text-base font-mono"
                />
                {shouldShowError('mwstNumber') && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.mwstNumber}
                  </p>
                )}
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <Label htmlFor="logo" className="text-base font-medium">Firmenlogo (optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Laden Sie Ihr Firmenlogo hoch. Dies hilft Kunden, Sie zu erkennen.
                </p>
                
                <Input
                  id="logo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                  className="hidden"
                />
                
                {uploadedFiles.logo ? (
                  <div className="border-2 border-dashed border-brand-300 bg-brand-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {uploadedFiles.logo.path && (
                          <img 
                            src={supabase.storage.from('handwerker-documents').getPublicUrl(uploadedFiles.logo.path).data.publicUrl}
                            alt="Logo Preview"
                            className="h-16 w-16 object-contain rounded border bg-white"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-success-600" />
                            <p className="font-medium text-success-700">Logo hochgeladen</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{uploadedFiles.logo.name}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedFiles(prev => {
                            const updated = { ...prev };
                            delete updated.logo;
                            return updated;
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                    className="w-full h-24 text-base border-2 border-dashed hover:border-brand-400 hover:bg-brand-50"
                    disabled={uploadProgress.logo === 'uploading'}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {uploadProgress.logo === 'uploading' ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                          <span>Logo wird hochgeladen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-brand-600" />
                          <span>Logo hochladen (max. 5MB)</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG, SVG oder WebP</span>
                        </>
                      )}
                    </div>
                  </Button>
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
                    onBlur={() => markTouched('firstName')}
                    placeholder="Max"
                    className="h-12 text-base"
                  />
                  {shouldShowError('firstName') && (
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
                    onBlur={() => markTouched('lastName')}
                    placeholder="Muster"
                    className="h-12 text-base"
                  />
                  {shouldShowError('lastName') && (
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
                  onBlur={() => markTouched('email')}
                  placeholder="max.muster@beispiel.ch"
                  className="h-12 text-base"
                  disabled={isAlreadyAuthenticated}
                />
                {isAlreadyAuthenticated && (
                  <p className="text-xs text-muted-foreground">
                    E-Mail kann nicht geändert werden (Sie sind bereits angemeldet)
                  </p>
                )}
                {shouldShowError('email') && (
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
                  onBlur={() => markTouched('phoneNumber')}
                  placeholder="+41 79 123 45 67"
                  className="h-12 text-base"
                />
                {shouldShowError('phoneNumber') && (
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
                  onBlur={() => markTouched('personalAddress')}
                  placeholder="Musterstrasse 123"
                  className="h-12 text-base"
                />
                {shouldShowError('personalAddress') && (
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
                  <PostalCodeInput
                    value={formData.personalZip}
                    onValueChange={(plz) => setFormData({ ...formData, personalZip: plz })}
                    onAddressSelect={(address) => setFormData({ 
                      ...formData, 
                      personalCity: address.city,
                      personalCanton: address.canton 
                    })}
                    onBlur={() => markTouched('personalZip')}
                    placeholder="8000"
                    className="h-12 text-base"
                  />
                  {shouldShowError('personalZip') && (
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
                    onBlur={() => markTouched('personalCity')}
                    placeholder="Zürich"
                    className="h-12 text-base"
                  />
                  {shouldShowError('personalCity') && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.personalCity}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="personalCanton" className="text-base font-medium">
                  Kanton (optional)
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
                {shouldShowError('personalCanton') && (
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
                    onBlur={() => markTouched('businessAddress')}
                    placeholder="Strasse & Hausnummer"
                    className="h-12 text-base"
                  />
                  {shouldShowError('businessAddress') && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.businessAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="businessZip" className="text-base font-medium">PLZ *</Label>
                    <PostalCodeInput
                      value={formData.businessZip}
                      onValueChange={(plz) => setFormData({ ...formData, businessZip: plz })}
                      onAddressSelect={(address) => setFormData({ 
                        ...formData, 
                        businessCity: address.city,
                        businessCanton: address.canton 
                      })}
                      onBlur={() => markTouched('businessZip')}
                      placeholder="8000"
                      className="h-12 text-base"
                    />
                    {shouldShowError('businessZip') && (
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
                      onBlur={() => markTouched('businessCity')}
                      placeholder="Zürich"
                      className="h-12 text-base"
                    />
                    {shouldShowError('businessCity') && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.businessCity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="businessCanton" className="text-base font-medium">Kanton (optional)</Label>
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
                  {shouldShowError('businessCanton') && (
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
                <CardDescription>Optional - Für Auszahlungen erforderlich</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="iban" className="text-base font-medium">IBAN (optional)</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase();
                      // Remove all spaces for length check
                      const cleanValue = value.replace(/\s/g, '');
                      
                      // Swiss IBAN: CH + 19 digits = 21 characters max (without spaces)
                      if (cleanValue.length <= 21) {
                        setFormData({ ...formData, iban: value });
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = formatIBAN(e.target.value);
                      setFormData({ ...formData, iban: formatted });
                      markTouched('iban');
                    }}
                    placeholder="CH76 0000 0000 0000 0000 0"
                    maxLength={26}
                    className="h-12 text-base font-mono"
                  />
                  {shouldShowError('iban') && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.iban}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bankName" className="text-base font-medium">Bankname (optional)</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    onBlur={() => markTouched('bankName')}
                    placeholder="z.B. UBS, Credit Suisse, PostFinance"
                    className="h-12 text-base"
                  />
                  {shouldShowError('bankName') && (
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
                {shouldShowError('liabilityInsuranceProvider') && (
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

              {/* Removed misleading document upload warning - sessionStorage temp ID exists for unrelated reasons */}

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
                {shouldShowError('insuranceValidUntil') && (
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
                      ) : uploadedFiles.insuranceDocument ? (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                          {uploadedFiles.insuranceDocument.name}
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
                    ) : uploadedFiles.tradeLicense ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                        {uploadedFiles.tradeLicense.name}
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
                <p className="text-base text-muted-foreground">Ihre Spezialisierungen (optional)</p>
              </div>
            </div>

            {shouldShowError('categories') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.categories}</AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Sie können diese Angaben auch später in Ihrem Profil ergänzen.
              </AlertDescription>
            </Alert>

            {/* Major Categories */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Hauptkategorien <span className="text-base font-normal text-muted-foreground">(optional)</span></h4>
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
                              <p className="text-sm font-semibold leading-tight">
                                {majorCat.id === 'elektroinstallationen' ? (
                                  <>
                                    Elektro-
                                    <br />
                                    installationen
                                  </>
                                ) : (
                                  majorCat.label
                                )}
                              </p>
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

            {/* Service Areas - Enhanced with Canton Selection */}
            <Card className="border-2 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Servicegebiet Auswahl</CardTitle>
                <CardDescription>
                  Wählen Sie Kantone oder spezifische Postleitzahlen (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {shouldShowError('serviceAreas') && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.serviceAreas}</AlertDescription>
                  </Alert>
                )}

                {/* Tabbed Selection Interface */}
                <Tabs defaultValue="postal-codes" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cantons">Nach Kantonen</TabsTrigger>
                    <TabsTrigger value="postal-codes">Nach PLZ</TabsTrigger>
                  </TabsList>
                  
                  {/* Canton Selection Tab */}
                  <TabsContent value="cantons" className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Kantone auswählen</Label>
                      <p className="text-sm text-muted-foreground">
                        Wählen Sie ganze Kantone für eine breite Abdeckung
                      </p>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {SWISS_CANTONS.map(canton => (
                        <Badge
                          key={canton.value}
                          variant={selectedCantons.includes(canton.value) ? "default" : "outline"}
                          className="cursor-pointer justify-center py-3 text-sm hover:scale-105 transition-transform"
                          onClick={() => toggleCanton(canton.value)}
                        >
                          {canton.value}
                          {selectedCantons.includes(canton.value) && (
                            <CheckCircle className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                    
                    {selectedCantons.length > 0 && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-900">
                          Sie decken ca. <strong>{calculatePostalCodeCount(selectedCantons)}</strong> Postleitzahlen 
                          in <strong>{selectedCantons.length}</strong> Kanton{selectedCantons.length > 1 ? 'en' : ''} ab
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  {/* Postal Code Selection Tab */}
                  <TabsContent value="postal-codes" className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Einzelne PLZ hinzufügen</Label>
                      <p className="text-sm text-muted-foreground">
                        Suchen Sie nach spezifischen Postleitzahlen
                      </p>
                    </div>

                    <div className="space-y-2">
                      <PostalCodeInput
                        value={tempPostalCode}
                        onValueChange={setTempPostalCode}
                        onAddressSelect={(address) => {
                          if (tempPostalCode && tempPostalCode.length === 4) {
                            addManualPostalCode(tempPostalCode);
                          }
                        }}
                        placeholder="z.B. 8000 (Zürich eingeben und auswählen)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Suchen Sie nach einer Postleitzahl und wählen Sie diese aus
                      </p>
                    </div>

                    {manualPostalCodes.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Hinzugefügte PLZ ({manualPostalCodes.length})
                        </Label>
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[60px]">
                          {manualPostalCodes.map((code, idx) => (
                            <Badge key={idx} variant="secondary" className="gap-1.5 pr-1.5 pl-3 py-1.5">
                              <span>{code}</span>
                              <X 
                                className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" 
                                onClick={() => removeManualPostalCode(code)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {manualPostalCodes.length === 0 && (
                      <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
                        Noch keine PLZ hinzugefügt
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Unified Display - Show All Selected Areas */}
                {(selectedCantons.length > 0 || manualPostalCodes.length > 0) && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Ihre Servicegebiete</Label>
                      <Badge variant="outline" className="text-xs">
                        {selectedCantons.length + manualPostalCodes.length} Einträge
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Display selected cantons */}
                      {selectedCantons.map(canton => (
                        <Badge 
                          key={canton} 
                          variant="default" 
                          className="gap-1.5 pr-1.5 pl-3 py-2"
                        >
                          <span className="font-semibold">{formatCantonDisplay(canton)}</span>
                          <X 
                            className="h-3.5 w-3.5 cursor-pointer hover:text-destructive-foreground transition-colors" 
                            onClick={() => removeCanton(canton)}
                          />
                        </Badge>
                      ))}

                      {/* Display manual postal codes */}
                      {manualPostalCodes.map(code => (
                        <Badge 
                          key={code} 
                          variant="secondary" 
                          className="gap-1.5 pr-1.5 pl-3 py-2"
                        >
                          <span>{code}</span>
                          <X 
                            className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" 
                            onClick={() => removeManualPostalCode(code)}
                          />
                        </Badge>
                      ))}
                    </div>

                    {/* Summary Card */}
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Geschätzte Abdeckung:</span>
                          <span className="font-semibold">
                            {selectedCantons.length > 0 
                              ? `~${calculatePostalCodeCount(selectedCantons)} PLZ` 
                              : `${manualPostalCodes.length} PLZ`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Empty State */}
                {selectedCantons.length === 0 && manualPostalCodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">Noch keine Servicegebiete ausgewählt</p>
                    <p className="text-xs mt-1">Wählen Sie Kantone oder fügen Sie PLZ hinzu</p>
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

              {/* 3. Banking Information - only show if filled */}
              {(formData.iban || formData.bankName) && (
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
                    {formData.iban && <SummaryItem label="IBAN" value={formData.iban} />}
                    {formData.bankName && <SummaryItem label="Bank" value={formData.bankName} />}
                  </CardContent>
                </Card>
              )}

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
                    <div className="space-y-3">
                      {selectedMajorCategories.length > 0 ? (
                        selectedMajorCategories.map((majorCatId) => {
                          const majorCat = majorCategories[majorCatId];
                          const selectedSubcats = formData.categories.filter(cat => 
                            majorCat.subcategories.includes(cat)
                          );
                          
                          return (
                            <div key={majorCatId} className="space-y-2">
                              {/* Major Category Badge */}
                              <Badge 
                                variant="default" 
                                className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
                              >
                                {majorCat.label}
                              </Badge>
                              
                              {/* Subcategories if any selected */}
                              {selectedSubcats.length > 0 && (
                                <div className="flex flex-wrap gap-2 ml-4 pl-2 border-l-2 border-brand-200">
                                  {selectedSubcats.map((cat) => (
                                    <Badge 
                                      key={cat} 
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {subcategoryLabels[cat]?.label || cat}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Message when no subcategories selected for this major category */}
                              {selectedSubcats.length === 0 && (
                                <p className="text-xs text-muted-foreground ml-4 pl-2 border-l-2 border-brand-200 italic">
                                  Keine spezifischen Fachgebiete ausgewählt
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine Kategorien ausgewählt</span>
                      )}
                    </div>
                  </div>
                  
                  {formData.serviceAreas.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Einsatzgebiete</p>
                      <div className="flex flex-wrap gap-2">
                        {/* Show cantons with formatting */}
                        {selectedCantons.map((canton) => (
                          <Badge key={canton} variant="default">
                            {formatCantonDisplay(canton)}
                          </Badge>
                        ))}
                        {/* Show manual postal codes */}
                        {manualPostalCodes.map((code) => (
                          <Badge key={code} variant="secondary">
                            {code}
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
                wird Ihr Profil innerhalb von 1-2 Werktagen durch unser Team geprüft.
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
            {localStorage.getItem(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);
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
                    Schritt {Math.min(recoveryData.currentStep, recoveryData.totalSteps)} von {recoveryData.totalSteps}
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
                  clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);
                  sessionStorage.removeItem('pending-recovery-data');
                  sessionStorage.removeItem('handwerker-upload-temp-id');
                  
                  // Reset all state to initial values
                  setCurrentStep(1);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phoneNumber: "",
                    personalAddress: "",
                    personalZip: "",
                    personalCity: "",
                    personalCanton: "",
                    companyName: "",
                    companyLegalForm: "einzelfirma",
                    uidNumber: "",
                    mwstNumber: "",
                    businessAddress: "",
                    businessZip: "",
                    businessCity: "",
                    businessCanton: "",
                    sameAsPersonal: false,
                    iban: "",
                    bankName: "",
                    liabilityInsuranceProvider: "",
                    policyNumber: "",
                    tradeLicenseNumber: "",
                    insuranceValidUntil: "",
                    categories: [] as string[],
                    serviceAreas: [] as string[],
                    hourlyRateMin: "",
                    hourlyRateMax: "",
                    bio: "",
                  });
                  setSelectedMajorCategories([]);
                  setSelectedCantons([]);
                  setManualPostalCodes([]);
                  setTempPostalCode('');
                  setUploadedFiles({});
                  setErrors({});
                  setTouched({});
                  
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
                    setErrors({}); // Clear any stale validation errors
                    setTouched({}); // Clear touched state for fresh start
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
