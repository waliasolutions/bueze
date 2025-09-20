import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, User, Settings as SettingsIcon } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  phone: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  canton: z.string().optional(),
});

const handwerkerSchema = z.object({
  bio: z.string().min(20, 'Beschreibung muss mindestens 20 Zeichen haben'),
  hourly_rate_min: z.number().min(30, 'Mindestlohn muss über 30 CHF sein'),
  hourly_rate_max: z.number().min(30, 'Maximallohn muss über 30 CHF sein'),
  categories: z.array(z.string()).min(1, 'Wählen Sie mindestens eine Kategorie'),
  service_areas: z.array(z.string()).min(1, 'Geben Sie mindestens ein Einsatzgebiet an'),
  languages: z.array(z.string()).min(1, 'Wählen Sie mindestens eine Sprache'),
  website: z.string().url('Ungültige URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type HandwerkerFormData = z.infer<typeof handwerkerSchema>;

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

const languages = [
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'it', label: 'Italienisch' },
  { value: 'en', label: 'Englisch' },
];

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [handwerkerProfile, setHandwerkerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      city: '',
      zip: '',
      canton: '',
    },
  });

  const handwerkerForm = useForm<HandwerkerFormData>({
    resolver: zodResolver(handwerkerSchema),
    defaultValues: {
      bio: '',
      hourly_rate_min: 60,
      hourly_rate_max: 120,
      categories: [],
      service_areas: [],
      languages: ['de'],
      website: '',
    },
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        profileForm.reset({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          city: profileData.city || '',
          zip: profileData.zip || '',
          canton: profileData.canton || '',
        });

        // If handwerker, fetch handwerker profile
        if (profileData.role === 'handwerker') {
          const { data: handwerkerData } = await supabase
            .from('handwerker_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (handwerkerData) {
            setHandwerkerProfile(handwerkerData);
            handwerkerForm.reset({
              bio: handwerkerData.bio || '',
              hourly_rate_min: handwerkerData.hourly_rate_min || 60,
              hourly_rate_max: handwerkerData.hourly_rate_max || 120,
              categories: handwerkerData.categories || [],
              service_areas: handwerkerData.service_areas || [],
              languages: handwerkerData.languages || ['de'],
              website: handwerkerData.website || '',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Fehler",
        description: "Beim Laden der Profildaten ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          canton: data.canton as any, // Type assertion for enum
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profil aktualisiert",
        description: "Ihre Profildaten wurden erfolgreich gespeichert.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler",
        description: "Beim Speichern des Profils ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmitHandwerker = async (data: HandwerkerFormData) => {
    setSaving(true);
    try {
      const handwerkerData = {
        ...data,
        user_id: user?.id,
        categories: data.categories as any, // Type assertion for enum array
      };

      if (handwerkerProfile) {
        // Update existing handwerker profile
        const { error } = await supabase
          .from('handwerker_profiles')
          .update({
            ...handwerkerData,
            categories: data.categories as any,
          })
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('handwerker_profiles')
          .insert({
            ...handwerkerData,
            categories: data.categories as any,
          });

        if (error) throw error;
      }

      toast({
        title: "Handwerker-Profil aktualisiert",
        description: "Ihr Handwerker-Profil wurde erfolgreich gespeichert.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error updating handwerker profile:', error);
      toast({
        title: "Fehler",
        description: "Beim Speichern des Handwerker-Profils ist ein Fehler aufgetreten.",
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
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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

  const isHandwerker = profile?.role === 'handwerker';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Profil bearbeiten</h1>
              <p className="text-muted-foreground">
                Verwalten Sie Ihre persönlichen Daten und Einstellungen
              </p>
            </div>
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">
                <User className="h-4 w-4 mr-2" />
                Persönliche Daten
              </TabsTrigger>
              {isHandwerker && (
                <TabsTrigger value="handwerker">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Handwerker-Profil
                </TabsTrigger>
              )}
              <TabsTrigger value="settings">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Einstellungen
              </TabsTrigger>
            </TabsList>

            {/* Personal Data Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Persönliche Daten</CardTitle>
                  <CardDescription>
                    Aktualisieren Sie Ihre grundlegenden Profilinformationen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vollständiger Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Max Mustermann" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefonnummer</FormLabel>
                            <FormControl>
                              <Input placeholder="+41 79 123 45 67" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
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
                          control={profileForm.control}
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
                        control={profileForm.control}
                        name="canton"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kanton</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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

                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Profil speichern
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Handwerker Profile Tab */}
            {isHandwerker && (
              <TabsContent value="handwerker">
                <Card>
                  <CardHeader>
                    <CardTitle>Handwerker-Profil</CardTitle>
                    <CardDescription>
                      Konfigurieren Sie Ihr professionelles Profil für potenzielle Kunden
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...handwerkerForm}>
                      <form onSubmit={handwerkerForm.handleSubmit(onSubmitHandwerker)} className="space-y-6">
                        <FormField
                          control={handwerkerForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beschreibung</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Beschreiben Sie Ihre Erfahrung und Spezialisierungen..."
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Eine aussagekräftige Beschreibung hilft Kunden, Sie zu finden.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={handwerkerForm.control}
                            name="hourly_rate_min"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mindestlohn (CHF/h)</FormLabel>
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
                            control={handwerkerForm.control}
                            name="hourly_rate_max"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximallohn (CHF/h)</FormLabel>
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
                          control={handwerkerForm.control}
                          name="categories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fachbereiche</FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {categories.map((category) => (
                                  <div key={category.value} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={category.value}
                                      checked={field.value?.includes(category.value)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, category.value]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== category.value));
                                        }
                                      }}
                                    />
                                    <label htmlFor={category.value} className="text-sm">
                                      {category.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={handwerkerForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.ihre-website.ch" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Handwerker-Profil speichern
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Konto-Einstellungen</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre Konto-Einstellungen und Präferenzen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rolle</label>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant="secondary">
                          {profile?.role === 'handwerker' ? 'Handwerker' : 'Auftraggeber'}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {isHandwerker && handwerkerProfile && (
                    <div>
                      <label className="text-sm font-medium">Verifikation</label>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant={handwerkerProfile.is_verified ? 'default' : 'secondary'}>
                          {handwerkerProfile.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
                        </Badge>
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Konto löschen</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Das Löschen Ihres Kontos kann nicht rückgängig gemacht werden.
                    </p>
                    <Button variant="destructive" disabled>
                      Konto löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;