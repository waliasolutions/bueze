import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReceivedProposals } from '@/components/ReceivedProposals';
import { RatingPrompt } from '@/components/RatingPrompt';
import { logWithCorrelation, captureException } from '@/lib/errorTracking';
import { trackError } from '@/lib/errorCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, Eye, Users, FileText } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '@/lib/swissTime';
import { getCategoryLabel } from '@/config/categoryLabels';
import { getUrgencyLabel, getUrgencyColor } from '@/config/urgencyLevels';
import type { LeadListItem, UserProfileBasic } from '@/types/entities';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileBasic | null>(null);
  const [myLeads, setMyLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logWithCorrelation('Dashboard: Page loaded');
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get real authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Fetch user data in parallel
      const [
        { data: profileData },
        { data: leadsData },
        { data: handwerkerProfileData }
      ] = await Promise.all([
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        
        // Fetch user's leads (exclude deleted)
        supabase
          .from('leads')
          .select('*')
          .eq('owner_id', user.id)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Check if user is handwerker
        supabase
          .from('handwerker_profiles')
          .select('id, is_verified')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      // Handle profile data
      if (profileData) {
        setProfile(profileData);
      } else {
        // Create basic profile if it doesn't exist
        setProfile({ 
          id: user.id, 
          full_name: user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'user' 
        });
      }

      // Set leads data
      setMyLeads(leadsData || []);

      // Check if handwerker and redirect if needed
      if (handwerkerProfileData) {
        navigate('/handwerker-dashboard');
        return;
      }
      
      logWithCorrelation('Dashboard: User data loaded', { 
        leadsCount: leadsData?.length 
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-10 w-52" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-24" />
              </div>

              {/* Lead Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
            <div className="flex gap-3">
              <Button onClick={() => navigate('/conversations')} variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Nachrichten
              </Button>
              <Button onClick={() => navigate('/submit-lead')}>
                <Plus className="mr-2 h-4 w-4" />
                Neuen Auftrag erstellen
              </Button>
            </div>
          </div>

          {/* Rating Prompt for completed leads */}
          {user && (
            <div className="mb-6">
              <RatingPrompt userId={user.id} />
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meine Aufträge</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myLeads.filter(l => l.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Aktive Aufträge</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offerten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myLeads.reduce((sum, lead) => sum + (lead.proposals_count || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total erhaltene Offerten
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="leads" className="space-y-6">
            <TabsList>
              <TabsTrigger value="leads">Meine Aufträge</TabsTrigger>
              <TabsTrigger value="proposals">
                <FileText className="h-4 w-4 mr-2" />
                Erhaltene Offerten
              </TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
            </TabsList>

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
                              <Badge className={getUrgencyColor(lead.urgency)}>
                                {getUrgencyLabel(lead.urgency)}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl mb-1">{lead.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground space-x-3">
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {lead.city}
                              </span>
                              <span>{getCategoryLabel(lead.category)}</span>
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
                            <span className="text-muted-foreground">Offerten:</span>
                            <span className="font-semibold">{lead.proposals_count || 0} erhalten</span>
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

            <TabsContent value="proposals" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Erhaltene Offerten</h2>
                <Button onClick={() => navigate('/proposals')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Alle Offerten verwalten
                </Button>
              </div>
              <ReceivedProposals userId={user?.id} />
            </TabsContent>

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
                      <p className="text-sm text-muted-foreground">Auftraggeber</p>
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