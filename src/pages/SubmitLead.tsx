import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { Badge } from '@/components/ui/badge';

const leadSchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben'),
  description: z.string().min(20, 'Beschreibung muss mindestens 20 Zeichen haben'),
  category: z.string().min(1, 'Bitte wählen Sie eine Kategorie'),
  budget_min: z.number().min(100, 'Mindestbudget muss über 100 CHF sein'),
  budget_max: z.number().min(100, 'Maximalbudget muss über 100 CHF sein'),
  urgency: z.string().min(1, 'Bitte wählen Sie die Dringlichkeit'),
  canton: z.string().min(1, 'Bitte wählen Sie einen Kanton'),
  zip: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben'),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben'),
  address: z.string().optional(),
  contactEmail: z.string().email('Gültige E-Mail erforderlich').optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  contactFirstName: z.string().optional().or(z.literal('')),
  contactLastName: z.string().optional().or(z.literal('')),
  contactPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  // Budget validation: max should be greater than min
  return data.budget_max >= data.budget_min;
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

const SubmitLead = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: preselectedCategory || '',
      budget_min: 500,
      budget_max: 2000,
      urgency: '',
      canton: '',
      zip: '',
      city: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      contactFirstName: '',
      contactLastName: '',
      contactPassword: '',
    },
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  // Auto-select category from URL parameter
  // Handle preselected category from URL parameter
  useEffect(() => {
    if (preselectedCategory) {
      // Check if it's a major category ID
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
    
    // Check total file count (max 2)
    if (uploadedUrls.length + filesArray.length > 2) {
      toast({
        title: "Zu viele Dateien",
        description: "Sie können maximal 2 Bilder hochladen.",
        variant: "destructive",
      });
      return;
    }

    // For guests, store files temporarily in state
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
      
      // Enhanced error messaging for file uploads
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
        description: "Sie können jetzt Ihren Auftrag abschließen.",
      });
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

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    
    // Add timeout warning after 15 seconds
    const timeoutId = setTimeout(() => {
      toast({
        title: "Dauert länger als erwartet...",
        description: "Bitte haben Sie noch einen Moment Geduld. Falls es nicht funktioniert, laden Sie die Seite neu.",
      });
    }, 15000);
    
    let user: any = null; // Declare user outside try block for error handling access
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
      
      // If user is not authenticated, validate contact details and create account
      if (!user) {
        // Validate contact details are provided
        if (!data.contactEmail || !data.contactFirstName || !data.contactLastName || !data.contactPassword) {
          toast({
            title: "Kontaktdaten fehlen",
            description: "Bitte füllen Sie alle erforderlichen Kontaktdaten aus oder melden Sie sich an.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setStep(4); // Go to contact details step
          return;
        }

        // Validate password length
        if (data.contactPassword.length < 6) {
          toast({
            title: "Passwort zu kurz",
            description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setStep(4);
          return;
        }

        const accountRequestId = getOrCreateRequestId('create-account');
        
        logWithCorrelation('Creating new account for guest', { email: data.contactEmail, accountRequestId });

        // Create new account
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
              description: "Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.",
              variant: "destructive",
            });
            setShowLoginForm(true);
            setStep(4);
          } else {
            throw signUpError;
          }
          setIsSubmitting(false);
          return;
        }

        clearRequestId('create-account');

        // User is already signed in after signUp, just refresh the session
        await supabase.auth.refreshSession();

        // Add 300ms delay for session propagation through Supabase connection pool
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verify session is available
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session not available after signup. Please try logging in.');
        }

        user = signUpData.user;
        
        toast({
          title: "Konto erstellt",
          description: "Ihr Auftrag wird jetzt gespeichert...",
        });

        logWithCorrelation('Account created successfully', { userId: user?.id });
      }

      if (!user) {
        throw new Error('User authentication failed');
      }

      const requestId = getOrCreateRequestId('create-lead');
      
      logWithCorrelation('Creating lead', { requestId, mediaCount: uploadedUrls.length });

      // Use supabaseQuery wrapper with optimized config
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
        maxAttempts: 1,  // No retries for faster response
        timeout: 5000,   // Reduce timeout to 5s
      });

      clearRequestId('create-lead');
      
      logWithCorrelation('Lead created successfully', { requestId });

      toast({
        title: "Auftrag erstellt",
        description: "Ihr Auftrag wurde erfolgreich erstellt und ist jetzt sichtbar für Handwerker.",
      });

      navigate('/dashboard');
    } catch (error) {
      captureException(error as Error, { 
        context: 'submitLead',
        userId: user?.id
      });
      logWithCorrelation('Lead creation failed', { 
        error,
        userId: user?.id 
      });
      
      // Enhanced error messaging with specific RLS handling
      const errorMessage = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.';
      let userFriendlyMessage = errorMessage;
      
      // Add RLS-specific error handling
      if (errorMessage.includes('row-level security') || 
          errorMessage.includes('policy') ||
          errorMessage.includes('permission denied') ||
          (error as any)?.code === '42501') {
        userFriendlyMessage = 'Sitzung nicht bereit. Bitte warten Sie einen Moment und versuchen Sie es erneut, oder melden Sie sich erneut an.';
        logWithCorrelation('RLS policy violation detected', { 
          errorMessage,
          errorCode: (error as any)?.code,
          userId: user?.id
        });
      } else if (errorMessage.includes('duplicate key') || (error as any)?.code === '23505') {
        // Lead was already created, just navigate
        userFriendlyMessage = 'Auftrag wurde bereits erstellt.';
        clearRequestId('create-lead');
        toast({
          title: "Auftrag erstellt",
          description: "Ihr Auftrag wurde erfolgreich erstellt und ist jetzt sichtbar für Handwerker.",
        });
        navigate('/dashboard');
        return;
      } else if (errorMessage.includes('email')) {
        userFriendlyMessage = 'Problem mit der E-Mail-Adresse. Bitte überprüfen Sie Ihre Eingabe.';
      } else if (errorMessage.includes('password')) {
        userFriendlyMessage = 'Problem mit dem Passwort. Es muss mindestens 6 Zeichen lang sein.';
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

  const nextStep = async () => {
    const maxStep = isAuthenticated ? 3 : 4;
    
    // Validate current step before proceeding
    if (step === 1) {
      const titleValid = await form.trigger('title');
      const descValid = await form.trigger('description');
      const catValid = await form.trigger('category');
      if (!titleValid || !descValid || !catValid) return;
    } else if (step === 2) {
      const budgetMinValid = await form.trigger('budget_min');
      const budgetMaxValid = await form.trigger('budget_max');
      const urgencyValid = await form.trigger('urgency');
      if (!budgetMinValid || !budgetMaxValid || !urgencyValid) return;
    } else if (step === 3) {
      const cantonValid = await form.trigger('canton');
      const zipValid = await form.trigger('zip');
      const cityValid = await form.trigger('city');
      if (!cantonValid || !zipValid || !cityValid) return;
    }
    
    if (step < maxStep) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Auftrag erstellen</h1>
            <p className="text-muted-foreground">
              Beschreiben Sie Ihr Projekt und erhalten Sie Angebote von qualifizierten Handwerkern.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Schritt {step} von {isAuthenticated ? 3 : 4}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((step / (isAuthenticated ? 3 : 4)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(step / (isAuthenticated ? 3 : 4)) * 100}%` }}
              />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Projektdetails</CardTitle>
                    <CardDescription>Beschreiben Sie Ihr Projekt im Detail</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projekttitel</FormLabel>
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
                          <FormLabel>Kategorie</FormLabel>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Wählen Sie die passende Kategorie für Ihr Projekt:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.values(majorCategories).map((majorCat) => {
                                const Icon = majorCat.icon;
                                const isSelected = field.value === majorCat.id;
                                
                                return (
                                  <Card
                                    key={majorCat.id}
                                    className={cn(
                                      "cursor-pointer transition-all hover:shadow-lg hover-scale",
                                      isSelected && "ring-2 ring-brand-600 bg-brand-50 shadow-lg"
                                    )}
                                    onClick={() => field.onChange(majorCat.id)}
                                  >
                                    <CardContent className="p-6 text-center">
                                      <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-3 transition-transform",
                                        `bg-gradient-to-br ${majorCat.color}`,
                                        isSelected ? 'scale-110' : ''
                                      )}>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projektbeschreibung</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beschreiben Sie Ihr Projekt detailliert..."
                              className="min-h-[120px]"
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

                    {/* File Upload Section */}
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

                      {/* Upload Progress */}
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

                      {/* Uploaded Files Preview */}
                      {uploadedUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
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
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Budget & Dringlichkeit</CardTitle>
                    <CardDescription>Geben Sie Ihr Budget und die Dringlichkeit an</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget von (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget bis (CHF)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dringlichkeit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wann soll das Projekt starten?" />
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

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Standort</CardTitle>
                    <CardDescription>Wo soll das Projekt durchgeführt werden?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="canton"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kanton</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie einen Kanton" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SWISS_CANTONS.map((canton) => (
                                <SelectItem key={canton.value} value={canton.value}>
                                  {canton.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PLZ</FormLabel>
                            <FormControl>
                              <PostalCodeInput
                                value={field.value}
                                onValueChange={field.onChange}
                                onAddressSelect={(address) => {
                                  // Auto-fill city if provided
                                  if (address.city) {
                                    form.setValue('city', address.city);
                                  }
                                  form.setValue('canton', address.canton as any);
                                  // Store coordinates for map visualization
                                  if (address.latitude && address.longitude) {
                                    setCoordinates({ lat: address.latitude, lng: address.longitude });
                                  }
                                }}
                              />
                            </FormControl>
              <FormDescription>
                Stadt und Kanton können automatisch ausgefüllt werden
              </FormDescription>
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
                <Input 
                  placeholder="z.B. Zürich"
                  {...field}
                />
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
                  </CardContent>
                </Card>
              )}

              {step === 4 && !isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kontaktdaten</CardTitle>
                    <CardDescription>
                      Um Ihren Auftrag zu erstellen, benötigen wir Ihre Kontaktdaten
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showLoginForm ? (
                      <>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Haben Sie bereits ein Konto?
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLoginForm(true)}
                            className="w-full"
                          >
                            Login
                          </Button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Oder neues Konto erstellen
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="contactFirstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vorname</FormLabel>
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
                                  <FormLabel>Nachname</FormLabel>
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
                                <FormLabel>E-Mail</FormLabel>
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
                                <FormLabel>Passwort</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Mindestens 6 Zeichen" 
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
                        </div>
                      </>
                    ) : (
                      <>
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
                              {isLoggingIn ? 'Wird angemeldet...' : 'Login'}
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
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Zurück
                  </Button>
                )}
                
                {step < (isAuthenticated ? 3 : 4) ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="ml-auto">
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