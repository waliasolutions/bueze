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
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { AddPaymentMethodDialog } from '@/components/AddPaymentMethodDialog';
import { PaymentHistoryTable } from '@/components/PaymentHistoryTable';
import { X, Receipt } from 'lucide-react';
import { ArrowLeft, Save, User, Settings as SettingsIcon, CreditCard, Crown } from 'lucide-react';
import { SWISS_CANTONS } from '@/config/cantons';
import ServiceAreaMap from '@/components/ServiceAreaMap';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { Label } from '@/components/ui/label';
import { majorCategories } from '@/config/majorCategories';
import { useUserRole } from '@/hooks/useUserRole';

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

// SSOT: Generate categories from majorCategories config
const categories = Object.values(majorCategories).map(cat => ({
  value: cat.id,
  label: cat.label,
}));


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
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isHandwerker: isHandwerkerRole, isAdmin } = useUserRole();

  // Role-aware back navigation
  const handleBackNavigation = () => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isHandwerkerRole) {
      navigate('/handwerker-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

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

        // Check if user is handwerker by checking handwerker_profiles table
        const { data: handwerkerData } = await supabase
          .from('handwerker_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (handwerkerData) {

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

          // Fetch subscription data
          const { data: subscriptionData } = await supabase
            .from('handwerker_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (subscriptionData) {
            const planType = subscriptionData.plan_type as 'free' | 'monthly' | '6_month' | 'annual';
            const plan = SUBSCRIPTION_PLANS[planType];
            
            setCurrentSubscription({
              plan: {
                id: plan.id,
                name: plan.name,
                displayName: plan.displayName,
                monthlyPrice: plan.pricePerMonth,
                yearlyPrice: plan.price,
                competitors: 0, // Deprecated field
                includedLeads: plan.proposalsLimit === -1 ? Infinity : plan.proposalsLimit,
                extraLeadPrice: 0,
                features: plan.features
              },
              isActive: subscriptionData.status === 'active',
              currentPeriodStart: subscriptionData.current_period_start,
              currentPeriodEnd: subscriptionData.current_period_end,
              usedLeads: subscriptionData.proposals_used_this_period || 0,
              isYearly: plan.billingCycle !== 'monthly',
              hasPaymentMethod: paymentMethods.length > 0 && paymentMethods.some(pm => pm.isVerified)
            });
          }

          // Mock payment methods for now
          setPaymentMethods([
            // This will be replaced with real data from payment provider
          ]);
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

  // Payment methods handlers
  const handleAddPaymentMethod = (newPaymentMethod: any) => {
    setPaymentMethods(prev => [...prev, newPaymentMethod]);
    
    // Update subscription to reflect payment method status
    if (currentSubscription) {
      setCurrentSubscription(prev => ({
        ...prev,
        hasPaymentMethod: true
      }));
    }
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    
    const remainingMethods = paymentMethods.filter(pm => pm.id !== id);
    if (currentSubscription) {
      setCurrentSubscription(prev => ({
        ...prev,
        hasPaymentMethod: remainingMethods.length > 0 && remainingMethods.some(pm => pm.isVerified)
      }));
    }
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
    );
  };

  // Subscription handlers
  const handleUpgradePlan = (planId: string) => {
    toast({
      title: "Upgrade wird vorbereitet",
      description: "Sie werden zur Zahlungsseite weitergeleitet...",
    });
    // In real implementation, redirect to payment flow
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Kündigung wird bearbeitet",
      description: "Ihr Abonnement wird zum Ende der Laufzeit gekündigt.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
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

  const isHandwerker = !!handwerkerProfile;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackNavigation}>
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
              {isHandwerker && (
                <TabsTrigger value="subscription">
                  <Crown className="h-4 w-4 mr-2" />
                  Abonnement
                </TabsTrigger>
              )}
              {isHandwerker && (
                <TabsTrigger value="payments">
                  <Receipt className="h-4 w-4 mr-2" />
                  Rechnungen
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
                          name="service_areas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Einsatzgebiete (PLZ)</FormLabel>
                              <FormDescription>
                                Geben Sie Postleitzahlen ein, in denen Sie arbeiten. Bereiche mit Bindestrich (z.B. 8000-8099).
                              </FormDescription>
                              <div className="space-y-3">
                                <Input
                                  placeholder="z.B. 8000, 8001-8099, 9000"
                                  value={serviceAreaInput}
                                  onChange={(e) => setServiceAreaInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                      e.preventDefault();
                                      const value = serviceAreaInput.trim();
                                      
                                      if (value) {
                                        const parts = value.split(',').map(p => p.trim()).filter(p => p);
                                        const validAreas: string[] = [];
                                        
                                        for (const part of parts) {
                                          if (part.includes('-')) {
                                            const [start, end] = part.split('-').map(p => p.trim());
                                            const startNum = parseInt(start);
                                            const endNum = parseInt(end);
                                            
                                            if (/^\d{4}$/.test(start) && /^\d{4}$/.test(end) && 
                                                startNum >= 1000 && startNum <= 9999 &&
                                                endNum >= 1000 && endNum <= 9999 &&
                                                startNum <= endNum) {
                                              validAreas.push(part);
                                            }
                                          } else if (/^\d{4}$/.test(part)) {
                                            const num = parseInt(part);
                                            if (num >= 1000 && num <= 9999) {
                                              validAreas.push(part);
                                            }
                                          }
                                        }
                                        
                                        if (validAreas.length > 0) {
                                          field.onChange([...new Set([...field.value, ...validAreas])]);
                                          setServiceAreaInput('');
                                        }
                                      }
                                    }
                                  }}
                                />
                                {field.value?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                                    {field.value.map((area, index) => (
                                      <Badge key={index} variant="secondary" className="cursor-pointer">
                                        {area}
                                        <X
                                          className="ml-1 h-3 w-3"
                                          onClick={() => {
                                            field.onChange(field.value.filter((_, i) => i !== index));
                                          }}
                                        />
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Service Area Map Preview */}
                        {handwerkerForm.watch('service_areas')?.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              Kartenvorschau Ihrer Einsatzgebiete
                            </Label>
                            <ServiceAreaMap serviceAreas={handwerkerForm.watch('service_areas') || []} />
                          </div>
                        )}

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

            {/* Subscription Tab - Only for Handwerker */}
            {isHandwerker && (
              <TabsContent value="subscription">
                <SubscriptionManagement
                  currentSubscription={currentSubscription}
                  availablePlans={[]}
                  onUpgradePlan={handleUpgradePlan}
                  onCancelSubscription={handleCancelSubscription}
                />
              </TabsContent>
            )}

            {/* Payments & Invoices Tab - Only for Handwerker */}
            {isHandwerker && (
              <TabsContent value="payments" className="space-y-6">
                {/* Payment History */}
                <PaymentHistoryTable userId={user?.id} />
                
                {/* Payment Methods */}
                <PaymentMethodCard
                  paymentMethods={paymentMethods}
                  onAddPaymentMethod={() => setShowAddPaymentDialog(true)}
                  onRemovePaymentMethod={handleRemovePaymentMethod}
                  onSetDefault={handleSetDefaultPaymentMethod}
                />
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
                          {handwerkerProfile.is_verified ? 'Geprüft' : 'Nicht geprüft'}
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

        {/* Add Payment Method Dialog */}
        <AddPaymentMethodDialog
          open={showAddPaymentDialog}
          onOpenChange={setShowAddPaymentDialog}
          onPaymentMethodAdded={handleAddPaymentMethod}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Profile;