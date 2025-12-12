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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, Eye, Users, FileText, Trash2, Archive, RotateCcw } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '@/lib/swissTime';
import { getCategoryLabel } from '@/config/categoryLabels';
import { getUrgencyLabel, getUrgencyColor } from '@/config/urgencyLevels';
import type { LeadListItem, UserProfileBasic } from '@/types/entities';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileBasic | null>(null);
  const [myLeads, setMyLeads] = useState<LeadListItem[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isHandwerker, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for role to load before fetching data to prevent incorrect redirects
    if (roleLoading) return;
    logWithCorrelation('Dashboard: Page loaded');
    fetchUserData();
  }, [roleLoading, isAdmin]);

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

      // Fetch user data in parallel (role check via useUserRole hook)
      const [
        { data: profileData },
        { data: leadsData },
        { data: archivedData },
        { data: handwerkerProfileData }
      ] = await Promise.all([
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        
        // Fetch user's active leads (exclude deleted and cancelled)
        supabase
          .from('leads')
          .select('*')
          .eq('owner_id', user.id)
          .not('status', 'in', '("deleted","cancelled")')
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Fetch archived/cancelled leads
        supabase
          .from('leads')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'cancelled')
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
      setArchivedLeads(archivedData || []);

      // Check if handwerker and redirect if needed (but NOT for admins testing client view)
      if (handwerkerProfileData && !isAdmin) {
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

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'deleted' })
        .eq('id', leadId)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: 'Auftrag gelöscht',
        description: 'Der Auftrag wurde erfolgreich gelöscht.',
      });
      
      setMyLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Fehler',
        description: 'Auftrag konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'cancelled' })
        .eq('id', leadId)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: 'Auftrag archiviert',
        description: 'Der Auftrag wurde ins Archiv verschoben.',
      });
      
      const archivedLead = myLeads.find(l => l.id === leadId);
      if (archivedLead) {
        setMyLeads(prev => prev.filter(l => l.id !== leadId));
        setArchivedLeads(prev => [{ ...archivedLead, status: 'cancelled' as const }, ...prev]);
      }
    } catch (error) {
      console.error('Error archiving lead:', error);
      toast({
        title: 'Fehler',
        description: 'Auftrag konnte nicht archiviert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'active' })
        .eq('id', leadId)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: 'Auftrag wiederhergestellt',
        description: 'Der Auftrag ist wieder aktiv.',
      });
      
      const restoredLead = archivedLeads.find(l => l.id === leadId);
      if (restoredLead) {
        setArchivedLeads(prev => prev.filter(l => l.id !== leadId));
        setMyLeads(prev => [{ ...restoredLead, status: 'active' as const }, ...prev]);
      }
    } catch (error) {
      console.error('Error restoring lead:', error);
      toast({
        title: 'Fehler',
        description: 'Auftrag konnte nicht wiederhergestellt werden.',
        variant: 'destructive',
      });
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `CHF ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  if (loading || roleLoading) {
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              {isAdmin && (
                <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                  Kunden-Ansicht
                </Badge>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Willkommen zurück, {profile?.full_name || 'User'}!
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              {/* Mobile: icon only, Desktop: full text */}
              <Button onClick={() => navigate('/conversations')} variant="outline" size="icon" className="sm:hidden h-10 w-10">
                <Users className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/conversations')} variant="outline" className="hidden sm:inline-flex">
                <Users className="mr-2 h-4 w-4" />
                Nachrichten
              </Button>
              <Button onClick={() => navigate('/submit-lead')} size="icon" className="sm:hidden h-10 w-10">
                <Plus className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/submit-lead')} className="hidden sm:inline-flex">
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

          <Tabs defaultValue="leads" className="space-y-6">
            <TabsList className="w-full flex flex-wrap sm:inline-flex h-auto p-1 gap-1">
              <TabsTrigger value="leads" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-2">
                <span className="hidden sm:inline">Meine Aufträge</span>
                <span className="sm:hidden">Aufträge</span>
                <span className="ml-1">({myLeads.filter(l => l.status === 'active').length})</span>
              </TabsTrigger>
              <TabsTrigger value="proposals" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-2">
                <span className="hidden sm:inline">Erhaltene Offerten</span>
                <span className="sm:hidden">Offerten</span>
                <span className="ml-1">({myLeads.reduce((sum, lead) => sum + (lead.proposals_count || 0), 0)})</span>
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-2">
                Archiv ({archivedLeads.length})
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-2">
                Profil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              {myLeads.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Sie haben noch keine Aufträge erstellt.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myLeads.map((lead) => {
                    const hasAcceptedProposal = lead.accepted_proposal_id;
                    const canDelete = !hasAcceptedProposal && lead.status !== 'completed';
                    
                    return (
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
                        <CardContent className="pt-0 space-y-2">
                          <Button
                            className="w-full"
                            onClick={() => navigate(`/lead/${lead.id}`)}
                          >
                            Verwalten
                          </Button>
                          <div className="flex gap-2">
                            {lead.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleArchiveLead(lead.id)}
                              >
                                <Archive className="h-4 w-4 mr-1" />
                                Archivieren
                              </Button>
                            )}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Löschen
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Dieser Auftrag wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLead(lead.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archive" className="space-y-6">
              <h2 className="text-xl font-semibold">Archivierte Aufträge</h2>
              
              {archivedLeads.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Sie haben keine archivierten Aufträge.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {archivedLeads.map((lead) => (
                    <Card key={lead.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2">Archiviert</Badge>
                            <CardTitle className="text-lg mb-1">{lead.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {lead.city}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreLead(lead.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Wiederherstellen
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