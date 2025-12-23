import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SWISS_CANTONS } from "@/config/cantons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Building2, Briefcase, X, CheckCircle, Clock, ChevronLeft, ChevronRight, Loader2, User, FileText, Eye, EyeOff, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { majorCategories } from "@/config/majorCategories";
import { subcategoryLabels } from "@/config/subcategoryLabels";
import { cn } from "@/lib/utils";
import { PostalCodeInput } from "@/components/PostalCodeInput";
import { ServiceAreaSelector } from "@/components/ServiceAreaSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ServiceRadius, buildServiceAreas, parseServiceAreas } from "@/lib/serviceAreaHelpers";
import { 
  saveVersionedData, 
  loadVersionedData, 
  clearVersionedData,
  STORAGE_KEYS,
  STORAGE_VERSIONS 
} from "@/lib/localStorageVersioning";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";

type StepContent = 'contact' | 'services' | 'summary';

const HandwerkerOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Track initial auth status - determines step flow for entire session
  const [startedAsGuest, setStartedAsGuest] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Inline login state (like SubmitLead)
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Simplified service areas - PLZ + radius approach
  const [businessPlz, setBusinessPlz] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessCanton, setBusinessCanton] = useState('');
  const [serviceRadius, setServiceRadius] = useState<ServiceRadius>('canton');
  const [customCantons, setCustomCantons] = useState<string[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    progress: number;
    lastSaveTime: string;
    currentStep: number;
    totalSteps: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Contact + Company (required)
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    companyName: "",
    companyLegalForm: "einzelfirma",
    
    // Step 2: Services (optional)
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

  // Helper to check if an error should be shown
  const shouldShowError = (field: string) => {
    return touched[field] && errors[field];
  };

  // Step configuration - use startedAsGuest for consistent flow
  const stepConfig = startedAsGuest
    ? { 1: 'contact' as StepContent, 2: 'services' as StepContent, 3: 'summary' as StepContent }
    : { 1: 'services' as StepContent, 2: 'summary' as StepContent };
  
  const stepLabelsConfig = startedAsGuest
    ? ['Kontakt & Firma', 'Services', 'Absenden']
    : ['Services', 'Absenden'];
  
  const totalStepsConfig = startedAsGuest ? 3 : 2;

  // Use SSOT multi-step form hook
  const {
    currentStep,
    currentContent,
    progress,
    stepLabels,
    isFirstStep,
    isLastStep,
    nextStep: goNextStep,
    prevStep: goPrevStep,
    setStep: setCurrentStep,
  } = useMultiStepForm<StepContent>({
    totalSteps: totalStepsConfig,
    stepContent: stepConfig,
    stepLabels: stepLabelsConfig,
  });

  const totalSteps = totalStepsConfig;

  // Update formData.serviceAreas based on radius selection using shared helper
  const updateServiceAreasFromRadius = (
    radius: ServiceRadius,
    plz: string,
    canton: string,
    selectedCustomCantons: string[]
  ) => {
    const areas = buildServiceAreas(radius, {
      plz,
      canton,
      customCantons: selectedCustomCantons,
    });
    setFormData(prev => ({ ...prev, serviceAreas: areas }));
  };


  // Check authentication status on mount and capture initial state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if already has handwerker profile
        const { data: existingProfile } = await supabase
          .from('handwerker_profiles')
          .select('id, verification_status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingProfile) {
          toast({
            title: "Profil bereits vorhanden",
            description: "Sie haben bereits ein Handwerker-Profil.",
          });
          navigate('/handwerker-dashboard');
          return;
        }
        
        // Pre-fill from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .maybeSingle();

        const nameParts = (profile?.full_name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          email: user.email || profile?.email || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phoneNumber: profile?.phone || '',
        }));
        
        setIsAuthenticated(true);
        setStartedAsGuest(false);
      } else {
        setStartedAsGuest(true);
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  // Parse serviceAreas to restore state when data is loaded using shared helper
  useEffect(() => {
    if (formData.serviceAreas.length > 0) {
      const config = parseServiceAreas(formData.serviceAreas);
      
      if (config.businessPlz) {
        setBusinessPlz(config.businessPlz);
      }
      if (config.businessCanton) {
        setBusinessCanton(config.businessCanton);
      }
      setServiceRadius(config.radius);
      if (config.radius === 'custom') {
        setCustomCantons(config.customCantons);
      }
    }
  }, []);

  // Helper function to check if form has meaningful progress
  const hasSignificantProgress = () => {
    if (currentStep > 1) return true;
    
    const hasFilledFields = 
      formData.companyName.trim() !== "" ||
      formData.firstName.trim() !== "" ||
      formData.lastName.trim() !== "" ||
      formData.email.trim() !== "";
    
    const hasSelectedCategories = selectedMajorCategories.length > 0;
    
    return hasFilledFields || hasSelectedCategories;
  };

  // Auto-save form data to localStorage
  useEffect(() => {
    const saveToLocalStorage = () => {
      if (!hasSignificantProgress()) return;
      
      const dataToSave = {
        currentStep,
        formData: { ...formData, password: '' }, // Never save password
        selectedMajorCategories,
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

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const { data, wasRecovered, lastSaved: savedAt } = loadVersionedData<{
        currentStep: number;
        formData: typeof formData;
        selectedMajorCategories: string[];
      }>({
        key: STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT,
        currentVersion: STORAGE_VERSIONS.HANDWERKER_ONBOARDING_DRAFT,
        ttlHours: 168,
        migrations: {
          2: (oldData: unknown) => oldData,
        },
      });

      if (wasRecovered && data && savedAt) {
        const savedProgress = Math.min(((data.currentStep - 1) / 3) * 100, 100);
        
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
        
        setRecoveryData({
          progress: savedProgress,
          lastSaveTime: lastSaveTimeStr,
          currentStep: data.currentStep,
          totalSteps: 3,
        });
        setShowRecoveryDialog(true);
        
        sessionStorage.setItem('pending-recovery-data', JSON.stringify(data));
      }
    };

    loadFromLocalStorage();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const content = stepConfig[step as keyof typeof stepConfig];

    if (content === 'contact') {
      // Step 1: Contact + Company validation
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
      if (!formData.password) {
        newErrors.password = "Passwort ist erforderlich";
      } else if (formData.password.length < 6) {
        newErrors.password = "Passwort muss mindestens 6 Zeichen lang sein";
      }
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Firmenname ist erforderlich";
      } else if (formData.companyName.trim().length < 2) {
        newErrors.companyName = "Firmenname muss mindestens 2 Zeichen lang sein";
      }
    }
    // Services step has no required fields
    // Summary step has no validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login for existing users (inline login form)
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie E-Mail und Passwort ein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Check if already has handwerker profile
        const { data: existingProfile } = await supabase
          .from('handwerker_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (existingProfile) {
          toast({
            title: "Profil vorhanden",
            description: "Sie haben bereits ein Handwerker-Profil.",
          });
          navigate('/handwerker-dashboard');
          return;
        }

        setIsAuthenticated(true);
        setShowLoginForm(false);
        
        // Pre-fill data from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', data.user.id)
          .maybeSingle();

        const nameParts = (profile?.full_name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          email: data.user.email || '',
          firstName: nameParts[0] || prev.firstName,
          lastName: nameParts.slice(1).join(' ') || prev.lastName,
          phoneNumber: profile?.phone || prev.phoneNumber,
        }));

        toast({
          title: "Angemeldet",
          description: "Fahren Sie mit der Registrierung fort.",
        });
        
        // Proceed to next step and scroll to top
        setCurrentStep(2);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte überprüfen Sie Ihre Zugangsdaten.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Create account and proceed (like SubmitLead pattern)
  const handleCreateAccountAndProceed = async () => {
    // Validate all Step 1 fields
    if (!validateStep(1)) {
      // Mark all fields as touched to show errors
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        password: true,
        companyName: true,
      });
      return;
    }

    setIsCreatingAccount(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phoneNumber,
          },
          emailRedirectTo: `${window.location.origin}/handwerker-dashboard`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            title: "E-Mail bereits registriert",
            description: "Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.",
            variant: "destructive",
          });
          setShowLoginForm(true);
          setLoginEmail(formData.email);
          return;
        }
        throw signUpError;
      }

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        toast({
          title: "E-Mail-Bestätigung erforderlich",
          description: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Sie können sich danach hier anmelden.",
          variant: "default",
        });
        setShowLoginForm(true);
        setLoginEmail(formData.email);
        return;
      }

      // User is signed in - refresh session
      await supabase.auth.refreshSession();
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "E-Mail-Bestätigung erforderlich",
          description: "Bitte bestätigen Sie Ihre E-Mail-Adresse und melden Sie sich dann an.",
          variant: "default",
        });
        setShowLoginForm(true);
        setLoginEmail(formData.email);
        return;
      }

      // Success! User is now authenticated
      setIsAuthenticated(true);
      toast({
        title: "Konto erstellt",
        description: "Wählen Sie jetzt Ihre Dienstleistungen.",
      });
      
      // Proceed to Step 2 (Services) and scroll to top
      setCurrentStep(2);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast({
        title: "Fehler bei der Registrierung",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleNext = async () => {
    if (currentContent === 'contact') {
      // For contact step, create account first (like SubmitLead)
      await handleCreateAccountAndProceed();
      return;
    }
    
    // For other steps, use the hook's nextStep (auto-scrolls)
    goNextStep();
  };

  const handleBack = () => {
    // Use the hook's prevStep (auto-scrolls)
    goPrevStep();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht angemeldet. Bitte laden Sie die Seite neu.');
      }

      // Create handwerker profile
      const insertData = {
        user_id: user.id,
        first_name: formData.firstName?.trim() || null,
        last_name: formData.lastName?.trim() || null,
        email: formData.email?.trim() || null,
        phone_number: formData.phoneNumber?.trim() || null,
        company_name: formData.companyName?.trim() || null,
        company_legal_form: formData.companyLegalForm?.trim() || null,
        bio: formData.bio?.trim() || null,
        categories: formData.categories?.length > 0 ? formData.categories : [] as any,
        service_areas: formData.serviceAreas?.length > 0 ? formData.serviceAreas : [],
        hourly_rate_min: formData.hourlyRateMin?.trim() ? parseInt(formData.hourlyRateMin) : null,
        hourly_rate_max: formData.hourlyRateMax?.trim() ? parseInt(formData.hourlyRateMax) : null,
        verification_status: 'pending',
        is_verified: false,
      };

      const { data: profileData, error } = await supabase
        .from("handwerker_profiles")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('email') || error.details?.includes('email')) {
            throw new Error('Diese E-Mail-Adresse ist bereits registriert.');
          }
          throw new Error('Ein Eintrag mit diesen Daten existiert bereits.');
        }
        throw error;
      }

      if (!profileData) {
        throw new Error('Failed to create profile');
      }

      // Trigger admin notification (non-blocking)
      supabase.functions.invoke('send-admin-registration-notification', {
        body: { profileId: profileData.id }
      }).catch(() => {});

      // Clear saved draft
      clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);

      // Assign handwerker role (non-blocking)
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .then(({ data: existingRoles }) => {
          const isAdmin = existingRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');
          if (!isAdmin) {
            supabase
              .from('user_roles')
              .upsert({ user_id: user.id, role: 'handwerker' }, { onConflict: 'user_id,role' })
              .then(() => {});
          }
        });
      
      toast({
        title: "Profil erstellt!",
        description: "Ihr Handwerker-Profil wurde erfolgreich erstellt und wird geprüft.",
        duration: 5000,
      });
      
      navigate("/handwerker-dashboard");
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentContent) {
      case 'contact':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Kontakt & Firma</h3>
                <p className="text-base text-muted-foreground">Ihre persönlichen Daten und Firmendaten</p>
              </div>
            </div>

            {/* Inline Login Form (shown when email exists) */}
            {showLoginForm && (
              <Card className="border-amber-200 bg-amber-50 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    E-Mail bereits registriert
                  </CardTitle>
                  <CardDescription>
                    Melden Sie sich an, um fortzufahren.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">E-Mail</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Passwort</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-12"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full h-12"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Anmelden...
                      </>
                    ) : (
                      'Anmelden'
                    )}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setShowLoginForm(false)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      Andere E-Mail verwenden
                    </button>
                    <a href="/auth?mode=reset" className="text-primary hover:underline">
                      Passwort vergessen?
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showLoginForm && (
              <div className="space-y-5">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => markTouched('email')}
                    placeholder="max@muster.ch"
                    className="h-12 text-base"
                  />
                  {shouldShowError('email') && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-base font-medium">Telefon *</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium">Passwort *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onBlur={() => markTouched('password')}
                      placeholder="Mindestens 6 Zeichen"
                      className="h-12 text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {shouldShowError('password') && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Company Information */}
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold">Firmendaten</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-base font-medium">Firmenname *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        onBlur={() => markTouched('companyName')}
                        placeholder="z.B. Muster Handwerk GmbH"
                        className="h-12 text-base"
                      />
                      {shouldShowError('companyName') && (
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyLegalForm" className="text-base font-medium">Rechtsform</Label>
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
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Mit der Registrierung erstellen wir Ihr Konto. Sie können weitere Details wie 
                  Versicherung, UID-Nummer und Bankdaten später in Ihrem Profil ergänzen.
                </p>
              </div>
            )}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Dienstleistungen</h3>
                <p className="text-base text-muted-foreground">Kategorien und Einsatzgebiete (optional)</p>
              </div>
            </div>

            <Alert className="border-brand-300 bg-brand-50 mb-6">
              <AlertCircle className="h-5 w-5 text-brand-600" />
              <AlertDescription className="text-base ml-2">
                Diese Angaben sind optional und können jederzeit in Ihrem Profil ergänzt werden.
              </AlertDescription>
            </Alert>

            {/* Category Selection */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Fachgebiete auswählen</CardTitle>
                <CardDescription>Wählen Sie Ihre Haupt- und Unterkategorien</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(majorCategories).map(([majorCatId, majorCat]) => {
                    const isExpanded = selectedMajorCategories.includes(majorCatId);
                    const selectedSubcatCount = formData.categories.filter(cat => 
                      majorCat.subcategories.includes(cat)
                    ).length;

                    return (
                      <Accordion
                        key={majorCatId}
                        type="single"
                        collapsible
                        value={isExpanded ? majorCatId : undefined}
                        onValueChange={(value) => {
                          if (value) {
                            setSelectedMajorCategories(prev => 
                              prev.includes(majorCatId) ? prev : [...prev, majorCatId]
                            );
                          }
                        }}
                      >
                        <AccordionItem value={majorCatId} className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isExpanded}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMajorCategories(prev => [...prev, majorCatId]);
                                  } else {
                                    setSelectedMajorCategories(prev => prev.filter(id => id !== majorCatId));
                                    // Remove all subcategories of this major category
                                    setFormData(prev => ({
                                      ...prev,
                                      categories: prev.categories.filter(cat => 
                                        !majorCat.subcategories.includes(cat)
                                      )
                                    }));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-medium">{majorCat.label}</span>
                              {selectedSubcatCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {selectedSubcatCount}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              {majorCat.subcategories.map(subcatId => {
                                const isSelected = formData.categories.includes(subcatId);
                                return (
                                  <div key={subcatId} className="flex items-center gap-2">
                                    <Checkbox
                                      id={subcatId}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          categories: checked
                                            ? [...prev.categories, subcatId]
                                            : prev.categories.filter(c => c !== subcatId)
                                        }));
                                      }}
                                    />
                                    <Label htmlFor={subcatId} className="text-sm cursor-pointer">
                                      {subcategoryLabels[subcatId]?.label || subcatId}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Service Areas - Using shared component */}
            <ServiceAreaSelector
              businessPlz={businessPlz}
              businessCity={businessCity}
              businessCanton={businessCanton}
              serviceRadius={serviceRadius}
              customCantons={customCantons}
              onBusinessPlzChange={(plz) => {
                setBusinessPlz(plz);
                if (plz.length < 4) {
                  setBusinessCity('');
                  setBusinessCanton('');
                }
              }}
              onAddressSelect={(address) => {
                setBusinessCity(address.city);
                setBusinessCanton(address.canton);
                updateServiceAreasFromRadius(serviceRadius, businessPlz, address.canton, customCantons);
              }}
              onRadiusChange={(radius) => {
                setServiceRadius(radius);
                updateServiceAreasFromRadius(radius, businessPlz, businessCanton, customCantons);
              }}
              onCustomCantonsChange={(cantons) => {
                setCustomCantons(cantons);
                updateServiceAreasFromRadius(serviceRadius, businessPlz, businessCanton, cantons);
              }}
            />

            {/* Optional Additional Info */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Zusätzliche Angaben</CardTitle>
                <CardDescription>Optional - hilft bei der Vermittlung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
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
                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

      case 'summary':
        return (
          <div className="space-y-6 animate-fade-in">
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

            <div className="space-y-4">
              {/* Contact & Company Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Kontakt & Firma</CardTitle>
                    </div>
                    {startedAsGuest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                      >
                        Bearbeiten
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">E-Mail</span>
                    <span className="text-sm font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Telefon</span>
                    <span className="text-sm font-medium">{formData.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Firma</span>
                    <span className="text-sm font-medium">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Rechtsform</span>
                    <span className="text-sm font-medium">{legalFormLabels[formData.companyLegalForm] || formData.companyLegalForm}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Services Summary */}
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
                      onClick={() => setCurrentStep(startedAsGuest ? 2 : 1)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Kategorien</p>
                    <div className="space-y-2">
                      {selectedMajorCategories.length > 0 ? (
                        selectedMajorCategories.map((majorCatId) => {
                          const majorCat = majorCategories[majorCatId];
                          const selectedSubcats = formData.categories.filter(cat => 
                            majorCat.subcategories.includes(cat)
                          );
                          
                          return (
                            <div key={majorCatId} className="space-y-1">
                              <Badge variant="default" className="bg-brand-600">
                                {majorCat.label}
                              </Badge>
                              {selectedSubcats.length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-4 pl-2 border-l-2 border-brand-200">
                                  {selectedSubcats.map((cat) => (
                                    <Badge key={cat} variant="secondary" className="text-xs">
                                      {subcategoryLabels[cat]?.label || cat}
                                    </Badge>
                                  ))}
                                </div>
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
                      <p className="text-sm font-medium text-muted-foreground mb-2">Einsatzgebiet</p>
                      <p className="text-sm">
                        {serviceRadius === 'city' && businessCity}
                        {serviceRadius === 'canton' && (SWISS_CANTONS.find(c => c.value === businessCanton)?.label || businessCanton)}
                        {serviceRadius === 'nationwide' && 'Ganze Schweiz'}
                        {serviceRadius === 'custom' && `${customCantons.length} Kantone: ${customCantons.join(', ')}`}
                      </p>
                    </div>
                  )}

                  {(formData.hourlyRateMin || formData.hourlyRateMax) && (
                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Stundenansatz</span>
                      <span className="text-sm font-medium">
                        CHF {formData.hourlyRateMin || '?'} - {formData.hourlyRateMax || '?'}
                      </span>
                    </div>
                  )}

                  {formData.bio && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</p>
                      <p className="text-sm">{formData.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Alert className="border-2 border-primary/20 bg-primary/5">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base ml-2">
                Nach dem Absenden wird Ihr Profil innerhalb von 1-2 Werktagen durch unser Team geprüft.
                Sie können weitere Details wie Versicherung und Dokumente später ergänzen.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading until initial auth check completes
  if (startedAsGuest === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded-full" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Mobile Sticky Progress Bar */}
          <div className="sm:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b py-3 -mx-4 px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Schritt {currentStep} von {totalSteps}</span>
              <span className="text-sm font-bold text-brand-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              {stepLabels.map((label, idx) => (
                <span key={idx} className={cn(
                  idx + 1 === currentStep && "text-brand-600 font-bold",
                  idx + 1 < currentStep && "text-primary"
                )}>{label}</span>
              ))}
            </div>
          </div>

          {/* Desktop Visual Progress Indicator */}
          <div className="mb-8 hidden sm:block">
            <div className="flex items-center justify-between mb-4">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
              
                return (
                  <div key={stepNum} className="flex flex-col items-center flex-1">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground shadow-lg scale-110",
                      isCurrent && "bg-brand-500 text-white shadow-xl scale-125 ring-4 ring-brand-200",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle className="h-5 w-5 md:h-6 md:w-6" /> : stepNum}
                    </div>
                    <p className={cn(
                      "text-[10px] md:text-xs mt-2 font-medium text-center",
                      isCurrent && "text-brand-600 font-bold",
                      isCompleted && "text-primary",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}>
                      {label}
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
                    Schritt {currentStep} von {totalSteps}
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

            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 px-6 text-base w-full sm:flex-1 min-h-[44px]"
                  disabled={isLoading || isCreatingAccount}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Zurück
                </Button>
              )}
              
              {currentContent !== 'summary' && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-12 px-6 text-base w-full sm:flex-1 min-h-[44px]"
                  disabled={isLoading || isCreatingAccount || (currentContent === 'contact' && showLoginForm)}
                >
                  {isCreatingAccount ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Konto wird erstellt...
                    </>
                  ) : (
                    <>
                      {currentContent === 'contact' ? 'Konto erstellen & Weiter' : 'Weiter'}
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
              
              {currentContent === 'summary' && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="h-12 px-6 text-base w-full sm:flex-1 bg-brand-600 hover:bg-brand-700 min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Wird eingereicht...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Profil einreichen</span>
                      <span className="sm:hidden">Einreichen</span>
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

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Zuletzt bearbeitet</p>
                      <p className="text-sm font-medium">{recoveryData.lastSaveTime}</p>
                    </div>
                  </div>

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
                    clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);
                    sessionStorage.removeItem('pending-recovery-data');
                    
                    setCurrentStep(1);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phoneNumber: "",
                      password: "",
                      companyName: "",
                      companyLegalForm: "einzelfirma",
                      categories: [],
                      serviceAreas: [],
                      hourlyRateMin: "",
                      hourlyRateMax: "",
                      bio: "",
                    });
                    setSelectedMajorCategories([]);
                    setBusinessPlz('');
                    setBusinessCity('');
                    setBusinessCanton('');
                    setServiceRadius('canton');
                    setCustomCantons([]);
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
                    const pendingData = sessionStorage.getItem('pending-recovery-data');
                    if (pendingData) {
                      const parsed = JSON.parse(pendingData);
                      setCurrentStep(parsed.currentStep || 1);
                      setFormData({ ...formData, ...parsed.formData });
                      setSelectedMajorCategories(parsed.selectedMajorCategories || []);
                    }
                    sessionStorage.removeItem('pending-recovery-data');
                    setShowRecoveryDialog(false);
                    toast({
                      title: "Fortschritt wiederhergestellt",
                      description: "Ihre gespeicherten Daten wurden geladen.",
                    });
                  }}
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700"
                >
                  Fortsetzen
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
