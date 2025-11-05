import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { logWithCorrelation, captureException } from '@/lib/errorTracking';
import { trackError } from '@/lib/errorCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, Clock, Coins, Eye, Users, TrendingUp, Crown, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatTimeAgo, formatNumber, formatCurrency } from '@/lib/swissTime';
import { checkSubscriptionAccess } from '@/lib/subscriptionHelpers';
import { getLeadStatus } from '@/config/leadStatuses';
import type { SubscriptionAccessCheck } from '@/lib/subscriptionHelpers';

interface Lead {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  urgency: string;
  canton: string;
  zip: string;
  city: string;
  created_at: string;
  purchased_count: number;
  max_purchases: number;
  quality_score: number;
  status: string;
}

interface Purchase {
  id: string;
  lead_id: string;
  price: number;
  purchased_at: string;
  lead: Lead;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

interface HandwerkerProfile {
  id: string;
  is_verified: boolean;
}

const categoryLabels = {
  elektriker: 'Elektriker',
  sanitaer: 'Sanitär',
  heizung: 'Heizungsinstallateur',
  klimatechnik: 'Klimatechnik',
  maler: 'Maler',
  gipser: 'Gipser',
  bodenleger: 'Bodenleger',
  plattenleger: 'Plattenleger',
  schreiner: 'Schreiner',
  maurer: 'Maurer',
  zimmermann: 'Zimmermann',
  dachdecker: 'Dachdecker',
  fassadenbauer: 'Fassadenbauer',
  gartenbau: 'Gartenbau',
  pflasterarbeiten: 'Pflasterarbeiten',
  zaun_torbau: 'Zaun- und Torbau',
  fenster_tueren: 'Fenster & Türen',
  kuechenbau: 'Küchenbau',
  badumbau: 'Badumbau',
  umzug: 'Umzug & Transport',
  reinigung: 'Reinigung',
  schlosserei: 'Schlosserei',
  spengler: 'Spengler'
};

const urgencyLabels = {
  today: 'Heute',
  this_week: 'Diese Woche',
  this_month: 'Dieser Monat',
  planning: 'Planung'
};

const urgencyColors = {
  today: 'bg-red-100 text-red-800',
  this_week: 'bg-orange-100 text-orange-800',
  this_month: 'bg-blue-100 text-blue-800',
  planning: 'bg-gray-100 text-gray-800'
};

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessCheck | null>(null);
  const [handwerkerProfile, setHandwerkerProfile] = useState<HandwerkerProfile | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logWithCorrelation('Dashboard: Page loaded');
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // DEMO MODE: Mock user for pitch presentation
      const mockUser = { id: 'demo-user-123', email: 'demo@bueze.ch' };
      
      // if (!user) {
      //   navigate('/auth');
      //   return;
      // }

      setUser(mockUser);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockUser.id)
        .single();

      setProfile(profileData || { id: mockUser.id, full_name: 'Demo User', email: mockUser.email, role: 'user' });

      // Fetch user's leads (exclude deleted) - show all for demo
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(10);

      setMyLeads(leadsData || []);

      // Check if user is handwerker by checking handwerker_profiles table
      const { data: handwerkerProfileData } = await supabase
        .from('handwerker_profiles')
        .select('id, is_verified')
        .eq('user_id', mockUser.id)
        .maybeSingle();

      if (handwerkerProfileData) {
        setHandwerkerProfile(handwerkerProfileData);
        // Mock subscription access for demo
        setSubscriptionAccess({ 
          canViewLead: true, 
          canPurchaseLead: true, 
          isUnlimited: true, 
          remainingViews: 999, 
          requiresUpgrade: false, 
          leadPrice: 20,
          planType: 'annual' 
        });
      }

      // Fetch user's purchases - show all for demo
      const { data: purchasesData } = await supabase
        .from('lead_purchases')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('purchased_at', { ascending: false })
        .limit(10);

      setPurchases(purchasesData || []);
      logWithCorrelation('Dashboard: User data loaded', { leadsCount: leadsData?.length, purchasesCount: purchasesData?.length });
    } catch (error) {
      const categorized = trackError(error);
      captureException(error as Error, { 
        context: 'fetchUserData',
        category: categorized.category 
      });
      logWithCorrelation('Dashboard: Error fetching user data', categorized);
      toast({
        title: "Fehler",
        description: "Beim Laden der Daten ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `CHF ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const isHandwerker = profile?.role === 'handwerker';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Willkommen zurück, {profile?.full_name || 'User'}!
              </p>
            </div>
            <Button onClick={() => navigate('/submit-lead')}>
              <Plus className="mr-2 h-4 w-4" />
              Neuen Auftrag erstellen
            </Button>
          </div>

          {/* Verification Status Card for Handwerkers */}
          {isHandwerker && handwerkerProfile && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Verifizierungs-Status</CardTitle>
                    <CardDescription>
                      {handwerkerProfile.is_verified 
                        ? 'Ihr Profil ist verifiziert' 
                        : 'Verfolgen Sie den Fortschritt Ihrer Verifizierung'}
                    </CardDescription>
                  </div>
                  <Badge variant={handwerkerProfile.is_verified ? 'default' : 'secondary'}>
                    {handwerkerProfile.is_verified ? 'Verifiziert' : 'In Prüfung'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {handwerkerProfile.is_verified
                    ? 'Sie können jetzt Aufträge durchsuchen und kaufen.'
                    : 'Ihr Profil wird überprüft. Laden Sie fehlende Dokumente hoch für eine schnellere Verifizierung.'}
                </p>
                <Button onClick={() => navigate('/handwerker-dashboard')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Status & Dokumente verwalten
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards - Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isHandwerker ? 'Gekaufte Aufträge' : 'Meine Aufträge'}
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isHandwerker ? purchases.length : myLeads.filter(l => l.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isHandwerker ? 'Total gekaufte Aufträge' : 'Aktive Aufträge'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interessenten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isHandwerker 
                    ? purchases.length
                    : myLeads.reduce((sum, lead) => sum + lead.purchased_count, 0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isHandwerker ? 'Aufträge angefragt' : 'Handwerker interessiert'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue={isHandwerker ? "purchases" : "leads"} className="space-y-6">
            <TabsList>
              {!isHandwerker && <TabsTrigger value="leads">Meine Aufträge</TabsTrigger>}
              {isHandwerker && <TabsTrigger value="purchases">Gekaufte Aufträge</TabsTrigger>}
              <TabsTrigger value="profile">Profil</TabsTrigger>
            </TabsList>

            {!isHandwerker && (
              <TabsContent value="leads" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Meine Aufträge</h2>
                  <Button onClick={() => navigate('/submit-lead')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neuen Auftrag erstellen
                  </Button>
                </div>

                {myLeads.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Sie haben noch keine Aufträge erstellt.
                      </p>
                      <Button onClick={() => navigate('/submit-lead')}>
                        Ersten Auftrag erstellen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myLeads.map((lead) => (
                      <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                  lead.status === 'active' ? 'default' : 
                                  lead.status === 'paused' ? 'secondary' :
                                  lead.status === 'completed' ? 'outline' : 'secondary'
                                }>
                                  {lead.status === 'active' ? 'Aktiv' :
                                   lead.status === 'paused' ? 'Pausiert' :
                                   lead.status === 'completed' ? 'Erledigt' : 'Entwurf'}
                                </Badge>
                                <Badge className={`${urgencyColors[lead.urgency as keyof typeof urgencyColors]}`}>
                                  {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                                </Badge>
                              </div>
                              <CardTitle className="text-xl mb-1">{lead.title}</CardTitle>
                              <div className="flex items-center text-sm text-muted-foreground space-x-3">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {lead.city}
                                </span>
                                <span>{categoryLabels[lead.category as keyof typeof categoryLabels]}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground mb-4 line-clamp-2">{lead.description}</p>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Budget:</span>
                              <span className="font-semibold">{formatBudget(lead.budget_min, lead.budget_max)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Interessenten:</span>
                              <span className="font-semibold">{lead.purchased_count} interessiert</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardContent className="pt-0">
                          <Button
                            className="w-full"
                            onClick={() => navigate(`/lead/${lead.id}`)}
                          >
                            Verwalten
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {isHandwerker && (
              <TabsContent value="purchases" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Gekaufte Aufträge</h2>
                  <Button onClick={() => navigate('/search')}>
                    Neue Aufträge finden
                  </Button>
                </div>

                {purchases.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Sie haben noch keine Aufträge gekauft.
                      </p>
                      <Button onClick={() => navigate('/search')}>
                        Aufträge durchsuchen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {purchases.map((purchase) => (
                      <Card key={purchase.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{purchase.lead.title}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{purchase.lead.zip} {purchase.lead.city}</span>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>Gekauft {formatTimeAgo(purchase.purchased_at)}</span>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {categoryLabels[purchase.lead.category as keyof typeof categoryLabels]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {purchase.lead.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatBudget(purchase.lead.budget_min, purchase.lead.budget_max)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Bezahlt: CHF {purchase.price / 100}
                            </div>
                          </div>

                          <Button 
                            className="w-full"
                            onClick={() => navigate(`/lead/${purchase.lead.id}`)}
                          >
                            Auftrag anzeigen
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil-Einstellungen</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre Kontoinformationen und Einstellungen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-muted-foreground">{profile?.full_name || 'Nicht angegeben'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rolle</label>
                      <p className="text-sm text-muted-foreground">
                        {profile?.role === 'handwerker' ? 'Handwerker' : 'Auftraggeber'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={() => navigate('/profile')}>Profil bearbeiten</Button>
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

export default Dashboard;