import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Briefcase,
  FileText,
  AlertCircle,
  RefreshCw,
  Globe,
  Trash2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface DashboardStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalLeads: number;
  activeLeads: number;
}

interface PendingHandwerker {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  created_at: string;
  categories: string[];
  phone_number: string | null;
  business_address: string | null;
}

const isRecentRegistration = (createdAt: string) => {
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceCreation <= 7;
};

const calculateCompleteness = (handwerker: PendingHandwerker) => {
  const fields = [
    handwerker.first_name,
    handwerker.last_name,
    handwerker.email,
    handwerker.phone_number,
    handwerker.company_name,
    handwerker.business_address,
  ];
  const filledFields = fields.filter(f => f && f.trim()).length;
  return Math.round((filledFields / fields.length) * 100);
};

const looksLikeTestData = (handwerker: PendingHandwerker) => {
  const testPatterns = /^(test|asdf|dummy|example|aaa|zzz)/i;
  return (
    testPatterns.test(handwerker.first_name || '') ||
    testPatterns.test(handwerker.last_name || '') ||
    testPatterns.test(handwerker.company_name || '') ||
    (handwerker.email && /^(test@test|example@example|asdf@|dummy@)/i.test(handwerker.email))
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalLeads: 0,
    activeLeads: 0,
  });
  const [recentPending, setRecentPending] = useState<PendingHandwerker[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [isResettingData, setIsResettingData] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [dateFilter, isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Nicht angemeldet',
          description: 'Bitte melden Sie sich an.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin']);

      if (!roleData || roleData.length === 0) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie haben keine Berechtigung für diese Seite.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      console.log('Loading dashboard data...');
      
      // Get handwerker stats
      const { data: handwerkerData, error: handwerkerError } = await supabase
        .from('handwerker_profiles')
        .select('id, verification_status, first_name, last_name, email, company_name, created_at, categories, phone_number, business_address');

      if (handwerkerError) {
        console.error('Error fetching handwerker:', handwerkerError);
        throw handwerkerError;
      }

      console.log(`Fetched ${handwerkerData?.length || 0} handwerker profiles`);

      const pending = handwerkerData?.filter(h => h.verification_status === 'pending') || [];
      const approved = handwerkerData?.filter(h => h.verification_status === 'approved') || [];
      const rejected = handwerkerData?.filter(h => h.verification_status === 'rejected') || [];

      console.log(`Pending: ${pending.length}, Approved: ${approved.length}, Rejected: ${rejected.length}`);

      // Get lead stats
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, status');

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        throw leadsError;
      }

      const activeLeads = leadsData?.filter(l => l.status === 'active') || [];

      setStats({
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        totalLeads: leadsData?.length || 0,
        activeLeads: activeLeads.length,
      });

      // Apply date filter
      let filteredPending = pending;
      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filteredPending = pending.filter(h => new Date(h.created_at) >= sevenDaysAgo);
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filteredPending = pending.filter(h => new Date(h.created_at) >= thirtyDaysAgo);
      }

      console.log(`Filtered pending (${dateFilter}): ${filteredPending.length}`);

      // Get recent pending handwerkers
      setRecentPending(
        filteredPending
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(h => ({
            id: h.id,
            first_name: h.first_name,
            last_name: h.last_name,
            email: h.email,
            company_name: h.company_name,
            created_at: h.created_at,
            categories: h.categories || [],
            phone_number: h.phone_number,
            business_address: h.business_address,
          }))
      );
      
      toast({
        title: 'Dashboard aktualisiert',
        description: 'Daten erfolgreich neu geladen.',
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Fehler',
        description: 'Dashboard-Daten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `vor ${diffHours} Stunden`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  };

  const handleResetTestData = async () => {
    try {
      setIsResettingData(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/reset-test-data',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset test data');
      }

      toast({
        title: 'Testdaten gelöscht',
        description: result.message,
      });

      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error resetting test data:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Testdaten konnten nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-ink-900 mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-ink-600">
                  Übersicht und Verwaltung der Plattform
                </p>
              </div>
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline"
                      disabled={isResettingData}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {isResettingData ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Lösche...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Testdaten löschen
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Testdaten wirklich löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion löscht alle Testbenutzer (@test.ch, @handwerk.ch) und deren zugehörige Daten:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Benutzerprofile und Authentifizierung</li>
                          <li>Handwerker-Profile</li>
                          <li>Aufträge (Leads)</li>
                          <li>Offerten und Käufe</li>
                          <li>Nachrichten und Konversationen</li>
                          <li>Bewertungen</li>
                        </ul>
                        <p className="mt-3 font-semibold text-destructive">
                          Diese Aktion kann nicht rückgängig gemacht werden!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetTestData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ja, Testdaten löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button 
                  onClick={loadDashboardData}
                  disabled={isRefreshing}
                  variant="outline"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aktualisiere...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Aktualisieren
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ausstehende Freigaben
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-amber-600">
                  {stats.pendingCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/admin/approvals')}
                >
                  Jetzt prüfen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Aktive Handwerker
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {stats.approvedCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Freigeschaltet und aktiv
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Aktive Aufträge
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {stats.activeLeads}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Von {stats.totalLeads} gesamt
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Abgelehnt
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-red-600">
                  {stats.rejectedCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nicht freigeschaltet
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lead-Verwaltung
                </CardTitle>
                <CardDescription>
                  Alle Aufträge und Offerten im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/leads')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Aufträge & Offerten verwalten
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Handwerker-Verwaltung
                </CardTitle>
                <CardDescription>
                  Profile prüfen und freischalten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/approvals')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Ausstehende Freigaben ({stats.pendingCount})
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Management
                </CardTitle>
                <CardDescription>
                  Website-Inhalte verwalten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/content')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Inhalte bearbeiten
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO Tools
                </CardTitle>
                <CardDescription>
                  Sitemap & Robots.txt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/seo')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  SEO verwalten
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Pending Handwerkers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kürzlich eingegangene Registrierungen</CardTitle>
                  <CardDescription>
                    Handwerker-Registrierungen, die auf Überprüfung warten
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={dateFilter} onValueChange={(value: 'all' | '7days' | '30days') => setDateFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle anzeigen</SelectItem>
                      <SelectItem value="7days">Letzte 7 Tage</SelectItem>
                      <SelectItem value="30days">Letzte 30 Tage</SelectItem>
                    </SelectContent>
                  </Select>
                  {stats.pendingCount > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/admin/approvals')}
                    >
                      Alle anzeigen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentPending.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.pendingCount === 0 
                      ? 'Keine ausstehenden Registrierungen. Alle Handwerker-Anträge wurden bearbeitet.'
                      : `Keine Registrierungen im ausgewählten Zeitraum (${dateFilter === '7days' ? 'Letzte 7 Tage' : dateFilter === '30days' ? 'Letzte 30 Tage' : 'Alle'}). Versuchen Sie einen anderen Filter.`}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {recentPending.map((handwerker) => {
                    const isRecent = isRecentRegistration(handwerker.created_at);
                    const completeness = calculateCompleteness(handwerker);
                    const isSuspicious = looksLikeTestData(handwerker);
                    
                    return (
                      <div 
                        key={handwerker.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">
                              {handwerker.first_name || '(Kein Name)'} {handwerker.last_name || ''}
                            </p>
                            {handwerker.company_name && (
                              <span className="text-sm text-muted-foreground">
                                • {handwerker.company_name}
                              </span>
                            )}
                            {isRecent && (
                              <Badge variant="default" className="text-xs">
                                NEU
                              </Badge>
                            )}
                            {isSuspicious && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Verdächtig
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {handwerker.email || '(Keine E-Mail)'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(handwerker.created_at)}</span>
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                completeness >= 80 ? "bg-green-500" :
                                completeness >= 50 ? "bg-yellow-500" : "bg-red-500"
                              )} />
                              <span>Vollständigkeit: {completeness}%</span>
                            </div>
                          </div>
                          {handwerker.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {handwerker.categories.slice(0, 3).map((cat) => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {handwerker.categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{handwerker.categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate('/admin/approvals')}
                          className="ml-4"
                        >
                          Prüfen
                        </Button>
                      </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {stats.pendingCount === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Keine ausstehenden Handwerker-Freigaben. Alle Registrierungen wurden bearbeitet.
            </AlertDescription>
          </Alert>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
