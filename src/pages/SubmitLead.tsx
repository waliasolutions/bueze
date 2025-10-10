import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Upload, X, FileIcon } from 'lucide-react';
import { uploadMultipleFiles, deleteLeadMedia } from '@/lib/fileUpload';
import { supabaseQuery } from '@/lib/fetchHelpers';
import { getOrCreateRequestId, clearRequestId } from '@/lib/idempotency';
import { captureException, logWithCorrelation } from '@/lib/errorTracking';

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
});

type LeadFormData = z.infer<typeof leadSchema>;

const categories = [
  { value: 'plumbing', label: 'Sanitär' },
  { value: 'electrical', label: 'Elektrik' },
  { value: 'painting', label: 'Malerei' },
  { value: 'carpentry', label: 'Schreinerei' },
  { value: 'roofing', label: 'Dacharbeiten' },
  { value: 'flooring', label: 'Bodenbeläge' },
  { value: 'heating', label: 'Heizung' },
  { value: 'garden', label: 'Garten' },
];

const cantons = [
  { value: 'AG', label: 'Aargau' },
  { value: 'ZH', label: 'Zürich' },
  { value: 'BE', label: 'Bern' },
  { value: 'LU', label: 'Luzern' },
  { value: 'SG', label: 'St. Gallen' },
  { value: 'VS', label: 'Wallis' },
  { value: 'TI', label: 'Tessin' },
  { value: 'VD', label: 'Waadt' },
  { value: 'GE', label: 'Genf' },
  { value: 'BS', label: 'Basel-Stadt' },
];

const urgencyLevels = [
  { value: 'planning', label: 'Planung (4+ Wochen)' },
  { value: 'flexible', label: 'Flexibel (2-4 Wochen)' },
  { value: 'soon', label: 'Bald (1-2 Wochen)' },
  { value: 'urgent', label: 'Dringend (unter 1 Woche)' },
];

const SubmitLead = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      budget_min: 500,
      budget_max: 2000,
      urgency: '',
      canton: '',
      zip: '',
      city: '',
      address: '',
    },
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um Dateien hochzuladen.",
        variant: "destructive",
      });
      return;
    }

    const filesArray = Array.from(files);
    
    // Check total file count
    if (uploadedUrls.length + filesArray.length > 10) {
      toast({
        title: "Zu viele Dateien",
        description: "Sie können maximal 10 Dateien hochladen.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      logWithCorrelation('Starting file upload', { count: filesArray.length });

      const results = await uploadMultipleFiles(
        filesArray,
        user.id,
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
          title: "Dateien hochgeladen",
          description: `${successes.length} Datei(en) erfolgreich hochgeladen.`,
        });
      }
    } catch (error) {
      captureException(error as Error, { context: 'handleFileUpload' });
      toast({
        title: "Upload fehlgeschlagen",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
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

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Sie müssen angemeldet sein, um einen Auftrag zu erstellen.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const requestId = getOrCreateRequestId('create-lead');
      
      logWithCorrelation('Creating lead', { requestId, mediaCount: uploadedUrls.length });

      // Use supabaseQuery wrapper with retry logic
      await supabaseQuery(async () => {
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
          });
      });

      clearRequestId('create-lead');
      
      logWithCorrelation('Lead created successfully', { requestId });

      toast({
        title: "Auftrag erstellt",
        description: "Ihr Auftrag wurde erfolgreich erstellt und ist jetzt sichtbar für Handwerker.",
      });

      navigate('/dashboard');
    } catch (error) {
      captureException(error as Error, { context: 'submitLead' });
      logWithCorrelation('Lead creation failed', { error });
      toast({
        title: "Fehler",
        description: "Beim Erstellen des Auftrags ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
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
              <span className="text-sm font-medium">Schritt {step} von 3</span>
              <span className="text-sm text-muted-foreground">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(step / 3) * 100}%` }}
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie eine Kategorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
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
                        <FormLabel>Dateien & Bilder (optional)</FormLabel>
                        <FormDescription className="mb-2">
                          Laden Sie bis zu 10 Bilder oder Dateien hoch (max. 10MB pro Datei)
                        </FormDescription>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={isUploading || uploadedUrls.length >= 10}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? 'Wird hochgeladen...' : 'Dateien auswählen'}
                          </Button>
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/quicktime"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {uploadedUrls.length}/10
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
                              {cantons.map((canton) => (
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
                              <Input placeholder="8000" {...field} />
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
                              <Input placeholder="Zürich" {...field} />
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

              <div className="flex justify-between">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Zurück
                  </Button>
                )}
                
                {step < 3 ? (
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