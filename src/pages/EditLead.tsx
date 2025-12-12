import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { SWISS_CANTONS, CANTON_CODES } from '@/config/cantons';
import { PostalCodeInput } from '@/components/PostalCodeInput';

const leadSchema = z.object({
  title: z.string().min(10, 'Titel muss mindestens 10 Zeichen haben'),
  description: z.string().min(50, 'Beschreibung muss mindestens 50 Zeichen haben'),
  category: z.string().min(1, 'Bitte wählen Sie eine Kategorie'),
  budget_min: z.number().min(0, 'Budget muss positiv sein'),
  budget_max: z.number().min(0, 'Budget muss positiv sein'),
  urgency: z.string().min(1, 'Bitte wählen Sie eine Dringlichkeit'),
  address: z.string().optional(),
  canton: z.string().min(1, 'Bitte wählen Sie einen Kanton'),
  zip: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben'),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben'),
});

type LeadFormData = z.infer<typeof leadSchema>;

const categories = [
  { value: 'elektriker', label: 'Elektriker' },
  { value: 'sanitaer', label: 'Sanitär' },
  { value: 'heizung', label: 'Heizungsinstallateur' },
  { value: 'maler', label: 'Maler' },
  { value: 'schreiner', label: 'Schreiner' },
];

const urgencies = [
  { value: 'today', label: 'Heute' },
  { value: 'this_week', label: 'Diese Woche' },
  { value: 'this_month', label: 'Dieser Monat' },
  { value: 'planning', label: 'Planung' },
];


const EditLead = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      budget_min: 0,
      budget_max: 0,
      urgency: '',
      address: '',
      canton: '',
      zip: '',
      city: '',
    },
  });

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch lead and verify ownership via RLS
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id) // RLS will enforce this
        .single();

      if (error || !lead) {
        console.error('Lead not found or no permission:', error);
        navigate('/dashboard');
        return;
      }

      // Populate form with lead data
      form.reset({
        title: lead.title,
        description: lead.description,
        category: lead.category,
        budget_min: lead.budget_min,
        budget_max: lead.budget_max,
        urgency: lead.urgency,
        address: lead.address || '',
        canton: lead.canton,
        zip: lead.zip,
        city: lead.city,
      });
    } catch (error) {
      console.error('Error fetching lead:', error);
      // Silent fail - navigate away
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...data,
          category: data.category as any,
          urgency: data.urgency as any,
          canton: data.canton as any,
          updated_at: new Date().toISOString(),
          ...(coordinates.lat && coordinates.lng ? { lat: coordinates.lat, lng: coordinates.lng } : {}),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Auftrag aktualisiert",
        description: "Ihre Änderungen wurden erfolgreich gespeichert.",
      });

      navigate(`/lead/${id}`);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Fehler",
        description: "Beim Speichern ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(`/lead/${id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Auftrag bearbeiten</h1>
              <p className="text-muted-foreground">
                Aktualisieren Sie die Details Ihres Auftrags
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auftragsinformationen</CardTitle>
              <CardDescription>
                Ändern Sie die Details Ihres Auftrags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Badezimmer Renovation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Beschreiben Sie Ihr Projekt im Detail..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategorie</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie eine Kategorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
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
                          <FormLabel>Dringlichkeit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen Sie die Dringlichkeit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {urgencies.map((urg) => (
                                <SelectItem key={urg.value} value={urg.value}>
                                  {urg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Min (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          <FormLabel>Budget Max (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Bahnhofstrasse 12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="canton"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kanton</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kanton" />
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
                                if (address.city) {
                                  form.setValue('city', address.city);
                                }
                                form.setValue('canton', address.canton as any);
                                if (address.latitude && address.longitude) {
                                  setCoordinates({ lat: address.latitude, lng: address.longitude });
                                }
                              }}
                              placeholder="8000"
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
                            <Input placeholder="Zürich" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/lead/${id}`)}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Speichert...' : 'Speichern'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditLead;
