import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import heroCraftsman from '@/assets/hero-craftsman.jpg';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Simplified schema for hero form - only essential fields
const heroLeadSchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben'),
  category: z.string().min(1, 'Bitte wählen Sie eine Kategorie'),
  description: z.string().min(20, 'Beschreibung muss mindestens 20 Zeichen haben'),
  canton: z.string().min(1, 'Bitte wählen Sie einen Kanton'),
  zip: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben'),
  budget_min: z.number().min(100, 'Mindestbudget muss über 100 CHF sein'),
  budget_max: z.number().min(100, 'Maximalbudget muss über 100 CHF sein'),
  urgency: z.string().min(1, 'Bitte wählen Sie die Dringlichkeit'),
});

const urgencyOptions = [
  { value: 'urgent', label: 'Dringend (innerhalb 1 Woche)' },
  { value: 'soon', label: 'Bald (innerhalb 1 Monat)' },
  { value: 'flexible', label: 'Flexibel (innerhalb 3 Monate)' },
];

type HeroLeadFormData = z.infer<typeof heroLeadSchema>;

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

export const Hero = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<HeroLeadFormData>({
    resolver: zodResolver(heroLeadSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      canton: '',
      zip: '',
      budget_min: 500,
      budget_max: 2000,
      urgency: 'flexible',
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof HeroLeadFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'category', 'description'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['budget_min', 'budget_max', 'urgency'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Projekt Details';
      case 2: return 'Budget & Dringlichkeit';
      case 3: return 'Standort';
      default: return '';
    }
  };

  const onSubmit = async (data: HeroLeadFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Store form data in sessionStorage for after auth
        sessionStorage.setItem('pendingLeadData', JSON.stringify(data));
        toast({
          title: "Anmeldung erforderlich",
          description: "Sie werden zur Anmeldung weitergeleitet und können dann Ihren Auftrag erstellen.",
        });
        navigate('/auth');
        return;
      }

      const { error } = await supabase
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
          city: '', // Will be filled from zip lookup
          owner_id: user.id,
          status: 'active' as any,
          budget_type: 'estimate' as any,
        });

      if (error) throw error;

      toast({
        title: "Auftrag erstellt",
        description: "Ihr Auftrag wurde erfolgreich erstellt!",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Fehler",
        description: "Beim Erstellen des Auftrags ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-pastel-blue-50 via-surface to-pastel-green-50">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroCraftsman} 
          alt="Schweizer Handwerker bei der Arbeit"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue-50/80 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
                  Geprüfte{' '}
                  <span className="text-brand-600">Handwerker</span>{' '}
                  in der Schweiz
                </h1>
                <p className="text-xl text-ink-700 leading-relaxed max-w-xl">
                  Schnell, vertrauenswürdig und transparent. Finden Sie den richtigen Experten für Ihr Projekt.
                </p>
                <div className="flex gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/submit-lead')}
                    variant="hero"
                  >
                    Auftrag erstellen
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/auth')}
                  >
                    Für Handwerker
                  </Button>
                </div>
              </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-6 text-sm text-ink-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>Über 5'000 geprüfte Betriebe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>Schweizweit verfügbar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span>Kostenlos für Auftraggeber</span>
              </div>
            </div>
          </div>

          {/* Right Column - Multistep Lead Creation Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-surface/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-ink-900 mb-2">
                  Auftrag erstellen
                </h3>
                <p className="text-sm text-ink-600 mb-4">
                  Kostenfrei & unverbindlich
                </p>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>Schritt {currentStep} von 3</span>
                    <span>{Math.round((currentStep / 3) * 100)}%</span>
                  </div>
                  <Progress value={(currentStep / 3) * 100} className="h-1" />
                  <p className="text-sm font-medium text-ink-700">{getStepTitle()}</p>
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Step 1: Project Basics */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Projekttitel</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="z.B. Badezimmer sanieren" 
                                className="h-9"
                                {...field} 
                              />
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
                            <FormLabel className="text-sm">Kategorie</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Kategorie wählen" />
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
                            <FormLabel className="text-sm">Beschreibung</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Kurze Projektbeschreibung..."
                                className="min-h-[80px] text-sm"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 2: Budget & Urgency */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="budget_min"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Budget von (CHF)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="500"
                                  className="h-9"
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
                              <FormLabel className="text-sm">Budget bis (CHF)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="2000"
                                  className="h-9"
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
                            <FormLabel className="text-sm">Dringlichkeit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Dringlichkeit wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {urgencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Location */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="canton"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Kanton</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Kanton wählen" />
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

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Postleitzahl</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="8000"
                                className="h-9"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-pastel-blue-50 p-4 rounded-2xl">
                        <h4 className="font-medium text-ink-900 mb-2">Zusammenfassung</h4>
                        <div className="space-y-1 text-sm text-ink-600">
                          <p><span className="font-medium">Projekt:</span> {form.watch('title') || 'Nicht angegeben'}</p>
                          <p><span className="font-medium">Kategorie:</span> {categories.find(c => c.value === form.watch('category'))?.label || 'Nicht angegeben'}</p>
                          <p><span className="font-medium">Budget:</span> CHF {form.watch('budget_min')} - {form.watch('budget_max')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-3 pt-4">
                    {currentStep > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Zurück
                      </Button>
                    )}
                    
                    <div className="ml-auto">
                      {currentStep < 3 ? (
                        <Button 
                          type="button"
                          variant="hero"
                          onClick={nextStep}
                          className="flex items-center gap-2"
                        >
                          Weiter
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          type="submit" 
                          variant="hero"
                          disabled={isSubmitting}
                          className="flex items-center gap-2"
                        >
                          {isSubmitting ? 'Wird erstellt...' : 'Auftrag erstellen'}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};