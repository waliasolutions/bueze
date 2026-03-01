import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Upload, X, FileIcon, CheckCircle } from 'lucide-react';
import { uploadMultipleFiles, deleteLeadMedia } from '@/lib/fileUpload';
import { supabaseQuery } from '@/lib/fetchHelpers';
import { getOrCreateRequestId, clearRequestId } from '@/lib/idempotency';
import { captureException, logWithCorrelation } from '@/lib/errorTracking';
import { SWISS_CANTONS } from '@/config/cantons';
import { PostalCodeInput } from '@/components/PostalCodeInput';
import { cn } from '@/lib/utils';
import { majorCategories } from '@/config/majorCategories';
import { CategorySelector } from '@/components/CategorySelector';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { Badge } from '@/components/ui/badge';
import { runAllSpamChecks, recordAttempt } from '@/lib/spamProtection';
import { validatePassword, PASSWORD_MIN_LENGTH } from '@/lib/validationHelpers';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { MultiStepProgress } from '@/components/ui/multi-step-progress';


// Schema with proper validation - no more .or(z.literal('')) bug
const leadSchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben'),
  description: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Bitte wählen Sie eine Kategorie'),
  budgetPreset: z.string().optional(),
  budget_min: z.number().optional().nullable(),
  budget_max: z.number().optional().nullable(),
  urgency: z.string().optional().default('planning'),
  zip: z.string().regex(/^\d{4}$/, 'PLZ muss genau 4 Ziffern haben'),
  city: z.string().optional().or(z.literal('')),
  canton: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  // Contact fields - REQUIRED for guests, properly validated (no .or(z.literal('')))
  contactEmail: z.string().email('Gültige E-Mail erforderlich'),
  contactPhone: z.string().optional().or(z.literal('')),
  contactFirstName: z.string().min(1, 'Vorname ist erforderlich'),
  contactLastName: z.string().min(1, 'Nachname ist erforderlich'),
  contactPassword: z.string().min(PASSWORD_MIN_LENGTH, `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen haben`),
  // Honeypot field
  website: z.string().max(0, 'Spam erkannt').optional().default(''),
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return data.budget_max >= data.budget_min;
  }
  return true;
}, {
  message: 'Maximalbudget muss größer oder gleich dem Mindestbudget sein',
  path: ['budget_max'],
});

type LeadFormData = z.infer<typeof leadSchema>;

// Generate categories dynamically from subcategoryLabels (SSOT)
const categories = Object.values(majorCategories).flatMap(majorCat => 
  majorCat.subcategories
    .map(subId => subcategoryLabels[subId])
    .filter(Boolean)
    .map(sub => ({
      value: sub.value,
      label: sub.label,
      group: majorCat.label
    }))
);

// Group categories by major category
const groupedCategories = categories.reduce((acc, cat) => {
  if (!acc[cat.group]) {
    acc[cat.group] = [];
  }
  acc[cat.group].push(cat);
  return acc;
}, {} as Record<string, typeof categories>);


const urgencyLevels = [
  { value: 'today', label: 'Heute / Sofort' },
  { value: 'this_week', label: 'Diese Woche' },
  { value: 'this_month', label: 'Diesen Monat' },
  { value: 'planning', label: 'Planung (nächste Monate)' },
];

// Budget presets for simpler selection
const budgetPresets = [
  { value: 'unknown', label: 'Noch unklar', min: null, max: null },
  { value: 'small', label: 'Unter 1\'000 CHF', min: 0, max: 1000 },
  { value: 'medium', label: '1\'000 - 5\'000 CHF', min: 1000, max: 5000 },
  { value: 'large', label: '5\'000 - 20\'000 CHF', min: 5000, max: 20000 },
  { value: 'xlarge', label: 'Über 20\'000 CHF', min: 20000, max: 100000 },
];

type StepContent = 'contact' | 'project' | 'location';

const SubmitLead = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Track if user started as guest - this determines step flow for the entire session
  const [startedAsGuest, setStartedAsGuest] = useState<boolean | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});
  const [formLoadTime] = useState(() => Date.now());
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

  // Step configuration - use startedAsGuest for consistent flow
  const stepConfig = startedAsGuest
    ? { 1: 'contact' as StepContent, 2: 'project' as StepContent, 3: 'location' as StepContent }
    : { 1: 'project' as StepContent, 2: 'location' as StepContent };
  
  const stepLabelsConfig = startedAsGuest
    ? ['Kontakt', 'Projekt', 'Standort']
    : ['Projekt', 'Standort'];
  
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
    setStep,
  } = useMultiStepForm<StepContent>({
    totalSteps: totalStepsConfig,
    stepContent: stepConfig,
    stepLabels: stepLabelsConfig,
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: preselectedCategory || '',
      budgetPreset: 'unknown',
      budget_min: null,
      budget_max: null,
      urgency: 'planning',
      canton: '',
      zip: '',
      city: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      contactFirstName: '',
      contactLastName: '',
      contactPassword: '',
      website: '',
    },
    // For authenticated users, we don't need contact field validation
    mode: 'onBlur',
  });

  // Check authentication status on mount and capture initial state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      // Capture initial state ONCE - this determines step flow for the entire session
      setStartedAsGuest(!user);
    };
    checkAuth();
  }, []);

  // Handle preselected category from URL parameter
  useEffect(() => {
    if (preselectedCategory) {
      const isMajorCategory = Object.values(majorCategories).some(
        cat => cat.id === preselectedCategory
      );
      
      if (isMajorCategory) {
        form.setValue('category', preselectedCategory);
      } else {
        toast({
          title: "Ungültige Kategorie",
          description: "Die ausgewählte Kategorie existiert nicht.",
          variant: "destructive",
        });
      }
    }
  }, [preselectedCategory, toast, form]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    if (uploadedUrls.length + filesArray.length > 2) {
      toast({
        title: "Zu viele Dateien",
        description: "Sie können maximal 2 Bilder hochladen.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || sessionStorage.getItem('correlation_id') || 'guest';

    setIsUploading(true);
    setUploadProgress(0);

    try {
      logWithCorrelation('Starting file upload', { count: filesArray.length });

      const results = await uploadMultipleFiles(
        filesArray,
        userId,
        (completed, total) => setUploadProgress((completed / total) * 100)
      );

      const errors = results.filter(r => r.error);
      const successes = results.filter(r => !r.error);

      if (errors.length > 0) {
        toast({
          title: "Einige Uploads fehlgeschlagen",
          description: errors.map(e => e.error).join(', '),
          variant: "destructive",
        });
      }

      if (successes.length > 0) {
        setUploadedUrls(prev => [...prev, ...successes.map(r => r.url)]);
        setUploadedPaths(prev => [...prev, ...successes.map(r => r.path)]);
        toast({
          title: "Bilder hochgeladen",
          description: `${successes.length} Bild(er) erfolgreich hochgeladen.`,
        });
        
        logWithCorrelation('Files uploaded successfully', { 
          count: successes.length, 
          userId: userId 
        });
      }
    } catch (error) {
      captureException(error as Error, { context: 'handleFileUpload' });
      
      let errorMsg = "Ein unerwarteter Fehler ist aufgetreten.";
      if (error instanceof Error) {
        if (error.message.includes('3MB') || error.message.includes('groß')) {
          errorMsg = "Datei zu groß. Maximum: 3MB pro Bild.";
        } else if (error.message.includes('2 Bilder')) {
          errorMsg = "Sie können maximal 2 Bilder hochladen.";
        } else if (error.message.includes('Dateityp')) {
          errorMsg = "Nur Bilddateien sind erlaubt (JPG, PNG, WEBP, GIF).";
        }
      }
      
      toast({
        title: "Upload fehlgeschlagen",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const path = uploadedPaths[index];
    const success = await deleteLeadMedia(path);

    if (success) {
      setUploadedUrls(prev => prev.filter((_, i) => i !== index));
      setUploadedPaths(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Datei entfernt",
        description: "Die Datei wurde erfolgreich entfernt.",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Die Datei konnte nicht entfernt werden.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      setIsAuthenticated(true);
      setShowLoginForm(false);
      toast({
        title: "Anmeldung erfolgreich",
        description: "Sie können jetzt Ihren Auftrag erstellen.",
      });
      // Move to next step (Project details) after login
      setStep(2);
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte prüfen Sie Ihre Eingaben.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Create account immediately after Step 1 contact validation (for guests)
  const handleCreateAccountAndProceed = async () => {
    // Validate contact fields
    const emailValid = await form.trigger('contactEmail');
    const firstNameValid = await form.trigger('contactFirstName');
    const lastNameValid = await form.trigger('contactLastName');
    const passwordValid = await form.trigger('contactPassword');
    
    if (!emailValid || !firstNameValid || !lastNameValid || !passwordValid) {
      return; // FormMessage shows inline errors
    }

    const data = form.getValues();
    setIsCreatingAccount(true);

    try {
      const accountRequestId = getOrCreateRequestId('create-account');
      logWithCorrelation('Creating account for guest at Step 1', { email: data.contactEmail, accountRequestId });

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.contactEmail,
        password: data.contactPassword,
        options: {
          data: {
            first_name: data.contactFirstName,
            last_name: data.contactLastName,
            full_name: `${data.contactFirstName} ${data.contactLastName}`,
            phone: data.contactPhone || '',
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
          setLoginEmail(data.contactEmail);
        } else {
          throw signUpError;
        }
        return;
      }

      clearRequestId('create-account');

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        toast({
          title: "E-Mail-Bestätigung erforderlich",
          description: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Sie können sich danach hier anmelden.",
          variant: "default",
        });
        setShowLoginForm(true);
        setLoginEmail(data.contactEmail);
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
        setLoginEmail(data.contactEmail);
        return;
      }

      // Success! User is now authenticated
      setIsAuthenticated(true);
      toast({
        title: "Konto erstellt",
        description: "Beschreiben Sie jetzt Ihr Projekt.",
      });
      
      logWithCorrelation('Account created successfully at Step 1', { userId: signUpData.user?.id });
      
      // Proceed to Step 2 (Project details)
      setStep(2);
    } catch (error) {
      captureException(error as Error, { context: 'createAccountStep1' });
      toast({
        title: "Fehler bei der Registrierung",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    // Run spam protection
    const spamCheck = runAllSpamChecks({
      honeypotValue: data.website || '',
      formLoadTime,
      rateLimitKey: 'lead_submit',
      title: data.title,
      description: data.description,
      minSubmitTimeSeconds: 5,
      maxAttemptsPerMinute: 3,
    });
    
    if (!spamCheck.isPassed) {
      toast({
        title: "Formular konnte nicht gesendet werden",
        description: spamCheck.reason || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      return;
    }
    
    recordAttempt('lead_submit');
    setIsSubmitting(true);
    
    const timeoutId = setTimeout(() => {
      toast({
        title: "Dauert länger als erwartet...",
        description: "Bitte haben Sie noch einen Moment Geduld.",
      });
    }, 15000);
    
    try {
      // User should already be authenticated (either from Step 1 or pre-existing)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Nicht angemeldet. Bitte laden Sie die Seite neu.');
      }

      const requestId = getOrCreateRequestId('create-lead');
      logWithCorrelation('Creating lead', { requestId, mediaCount: uploadedUrls.length });

      const leadResult = await supabaseQuery(async () => {
        return await supabase
          .from('leads')
          .insert({
            title: data.title,
            description: data.description,
            category: data.category as any,
            budget_min: data.budget_min,
            budget_max: data.budget_max,
            urgency: data.urgency as any,
            canton: data.canton as any,
            zip: data.zip,
            city: data.city,
            address: data.address,
            owner_id: user.id,
            status: 'active' as any,
            budget_type: 'estimate' as any,
            media_urls: uploadedUrls,
            request_id: requestId,
            lat: coordinates.lat || null,
            lng: coordinates.lng || null,
          })
          .select();
      }, {
        maxAttempts: 1,
        timeout: 5000,
      });

      clearRequestId('create-lead');
      logWithCorrelation('Lead created successfully', { requestId });

      toast({
        title: "Auftrag erstellt",
        description: "Ihr Auftrag wurde erfolgreich erstellt.",
      });

      navigate('/auftrag-erfolgreich', { 
        state: { leadTitle: data.title } 
      });
    } catch (error) {
      captureException(error as Error, { context: 'submitLead' });
      
      const errorMessage = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.';
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('row-level security') || 
          errorMessage.includes('policy') ||
          errorMessage.includes('permission denied') ||
          (error as any)?.code === '42501') {
        userFriendlyMessage = 'Sitzung nicht bereit. Bitte laden Sie die Seite neu und versuchen Sie es erneut.';
      } else if (errorMessage.includes('duplicate key') || (error as any)?.code === '23505') {
        userFriendlyMessage = 'Auftrag wurde bereits erstellt.';
        clearRequestId('create-lead');
        toast({
          title: "Auftrag erstellt",
          description: "Ihr Auftrag wurde erfolgreich erstellt.",
        });
        navigate('/dashboard');
        return;
      } else if (errorMessage.includes('network')) {
        userFriendlyMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.';
      }
      
      toast({
        title: "Fehler beim Erstellen",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };
  // Validation before advancing to next step
  const handleNextStep = async () => {
    if (currentContent === 'project') {
      const titleValid = await form.trigger('title');
      const catValid = await form.trigger('category');
      if (!titleValid || !catValid) return;
    } else if (currentContent === 'location') {
      const zipValid = await form.trigger('zip');
      if (!zipValid) return;
    }
    
    goNextStep();
  };

  const totalSteps = totalStepsConfig;

  // Show loading state until initial auth check is complete
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
      <DynamicHelmet
        title="Auftrag erstellen - Kostenlos Handwerker finden | Büeze.ch"
        description="Erstellen Sie kostenlos einen Auftrag und erhalten Sie Offerten von geprüften Handwerkern in Ihrer Region. Schnell, einfach und unverbindlich."
        robotsMeta="noindex,nofollow"
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Auftrag erstellen</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Beschreiben Sie Ihr Projekt und erhalten Sie Angebote von qualifizierten Handwerkern.
            </p>
          </div>

          {/* Progress indicator - using SSOT component */}
          <MultiStepProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={stepLabels}
            progress={progress}
          />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Honeypot field */}
              <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} tabIndex={-1} autoComplete="off" placeholder="Leave empty" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 1 for Guests: Contact Details */}
              {currentContent === 'contact' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kontaktdaten</CardTitle>
                    <CardDescription>
                      Erstellen Sie ein kostenloses Konto, um Ihren Auftrag zu veröffentlichen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showLoginForm ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="contactFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vorname *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Max" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactLastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nachname *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Mustermann" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="max.mustermann@example.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel" 
                                  placeholder="+41 79 123 45 67" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passwort *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder={`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Wählen Sie ein sicheres Passwort für Ihr Konto
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Bereits registriert?{' '}
                          <button 
                            type="button" 
                            onClick={() => setShowLoginForm(true)}
                            className="text-primary hover:underline font-medium"
                          >
                            Hier anmelden
                          </button>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Melden Sie sich mit Ihrem bestehenden Konto an
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <FormLabel>E-Mail</FormLabel>
                            <Input
                              type="email"
                              placeholder="ihre@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                            />
                          </div>

                          {loginEmail.trim().toLowerCase() !== (form.getValues('contactEmail') || '').trim().toLowerCase() && loginEmail.trim() !== '' && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                form.setValue('contactEmail', loginEmail.trim());
                                setShowLoginForm(false);
                              }}
                            >
                              Mit «{loginEmail.trim()}» registrieren
                            </Button>
                          )}

                          <div>
                            <FormLabel>Passwort</FormLabel>
                            <Input
                              type="password"
                              placeholder="Ihr Passwort"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                            />
                          </div>

                          <Button
                            type="button"
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                            className="w-full"
                          >
                            {isLoggingIn ? 'Wird angemeldet...' : 'Anmelden'}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowLoginForm(false)}
                            className="w-full"
                          >
                            Zurück zur Registrierung
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Project Details Step */}
              {currentContent === 'project' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Projektdetails</CardTitle>
                    <CardDescription>Beschreiben Sie Ihr Projekt</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projekttitel *</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Badezimmer sanieren" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategorie *</FormLabel>
                          <p className="text-sm text-muted-foreground mb-3">
                            Wählen Sie die passende Kategorie für Ihr Projekt:
                          </p>
                          <CategorySelector
                            mode="single"
                            selected={field.value}
                            onSelect={(value) => field.onChange(value as string)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projektbeschreibung (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beschreiben Sie Ihr Projekt detailliert..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Je detaillierter die Beschreibung, desto besser können Handwerker Ihr Projekt einschätzen.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload */}
                    <div className="space-y-4">
                      <div>
                        <FormLabel>Bilder (optional)</FormLabel>
                        <FormDescription className="mb-2">
                          Laden Sie bis zu 2 Bilder hoch (max. 3MB pro Bild)
                        </FormDescription>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={isUploading || uploadedUrls.length >= 2}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? 'Wird hochgeladen...' : 'Bilder auswählen'}
                          </Button>
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {uploadedUrls.length}/2
                          </span>
                        </div>
                      </div>

                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Upload läuft...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {uploadedUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {uploadedUrls.map((url, index) => (
                            <div 
                              key={index} 
                              className="relative group border rounded-lg overflow-hidden aspect-video"
                            >
                              {url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                <img 
                                  src={url} 
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 min-h-[44px] min-w-[44px] h-8 w-8 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Step (includes budget) */}
              {currentContent === 'location' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Standort & Budget</CardTitle>
                    <CardDescription>Wo soll das Projekt durchgeführt werden?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PLZ *</FormLabel>
                            <FormControl>
                              <PostalCodeInput
                                value={field.value}
                                onValueChange={field.onChange}
                                onAddressSelect={(address) => {
                                  if (address.city) {
                                    form.setValue('city', address.city);
                                  }
                                  form.setValue('canton', address.canton as any);
                                  if (address.latitude && address.longitude) {
                                    setCoordinates({ lat: address.latitude, lng: address.longitude });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stadt</FormLabel>
                            <FormControl>
                              <Input placeholder="z.B. Zürich" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Bahnhofstrasse 1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Die genaue Adresse wird nur mit ausgewählten Handwerkern geteilt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetPreset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Geschätztes Budget (optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              const preset = budgetPresets.find(p => p.value === value);
                              if (preset) {
                                form.setValue('budget_min', preset.min);
                                form.setValue('budget_max', preset.max);
                              }
                            }} 
                            value={field.value || 'unknown'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie einen Budgetrahmen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {budgetPresets.map((preset) => (
                                <SelectItem key={preset.value} value={preset.value}>
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dringlichkeit (optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'planning'}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie die Dringlichkeit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {urgencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Navigation buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                {!isFirstStep && (
                  <Button type="button" variant="outline" onClick={goPrevStep} className="min-h-[44px] w-full sm:w-auto">
                    Zurück
                  </Button>
                )}
                
                {/* Step 1 for guests: Create account button */}
                {currentContent === 'contact' && !showLoginForm && (
                  <Button 
                    type="button" 
                    onClick={handleCreateAccountAndProceed}
                    disabled={isCreatingAccount}
                    className="ml-auto min-h-[44px] w-full sm:w-auto"
                  >
                    {isCreatingAccount ? 'Wird erstellt...' : 'Weiter'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Normal next step */}
                {currentContent !== 'contact' && !isLastStep && (
                  <Button type="button" onClick={handleNextStep} className="ml-auto min-h-[44px] w-full sm:w-auto">
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Final submit */}
                {isLastStep && currentContent !== 'contact' && (
                  <Button type="submit" disabled={isSubmitting} className="ml-auto min-h-[44px] w-full sm:w-auto">
                    {isSubmitting ? 'Wird erstellt...' : 'Auftrag erstellen'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitLead;
