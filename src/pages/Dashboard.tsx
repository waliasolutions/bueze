import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, Clock, Euro, Eye, Users, TrendingUp } from 'lucide-react';

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
  role: string;
}

const categoryLabels = {
  plumbing: 'Sanitär',
  electrical: 'Elektrik',
  painting: 'Malerei',
  carpentry: 'Schreinerei',
  roofing: 'Dacharbeiten',
  flooring: 'Bodenbeläge',
  heating: 'Heizung',
  garden: 'Garten',
};

const urgencyLabels = {
  planning: 'Planung',
  flexible: 'Flexibel',
  soon: 'Bald',
  urgent: 'Dringend',
};

const urgencyColors = {
  planning: 'bg-blue-100 text-blue-800',
  flexible: 'bg-green-100 text-green-800',
  soon: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
};

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

      setProfile(profileData);

      // Fetch user's leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      setMyLeads(leadsData || []);

      // Fetch user's purchases
      const { data: purchasesData } = await supabase
        .from('lead_purchases')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('buyer_id', user.id)
        .order('purchased_at', { ascending: false });

      setPurchases(purchasesData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
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
    return `CHF ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;
    return `vor ${Math.floor(diffInHours / 168)} Wochen`;
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isHandwerker ? 'Gekaufte Aufträge' : 'Meine Aufträge'}
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isHandwerker ? purchases.length : myLeads.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isHandwerker ? 'Total gekaufte Aufträge' : 'Aktive Aufträge'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isHandwerker ? 'Ausgaben' : 'Verkäufe'}
                </CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  CHF {isHandwerker 
                    ? (purchases.length * 20).toLocaleString()
                    : (myLeads.reduce((sum, lead) => sum + (lead.purchased_count * 20), 0)).toLocaleString()
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isHandwerker ? 'Für Aufträge ausgegeben' : 'Durch Verkäufe verdient'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isHandwerker 
                    ? '85%'
                    : myLeads.length > 0 
                      ? Math.round((myLeads.filter(lead => lead.purchased_count > 0).length / myLeads.length) * 100)
                      : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  {isHandwerker ? 'Erfolgreiche Bewerbungen' : 'Verkaufte Aufträge'}
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
                      <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{lead.title}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{lead.zip} {lead.city}</span>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>{getTimeAgo(lead.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={urgencyColors[lead.urgency as keyof typeof urgencyColors]}>
                                {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                              </Badge>
                              <Badge variant="secondary">
                                {categoryLabels[lead.category as keyof typeof categoryLabels]}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {lead.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatBudget(lead.budget_min, lead.budget_max)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{lead.purchased_count}/{lead.max_purchases}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Verkaufte Plätze</span>
                              <span>{lead.purchased_count}/{lead.max_purchases}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(lead.purchased_count / lead.max_purchases) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => navigate(`/lead/${lead.id}`)}
                            >
                              Anzeigen
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => navigate(`/lead/${lead.id}/edit`)}
                            >
                              Bearbeiten
                            </Button>
                          </div>
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
                                <span>Gekauft {getTimeAgo(purchase.purchased_at)}</span>
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
                              <Euro className="h-4 w-4 text-muted-foreground" />
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