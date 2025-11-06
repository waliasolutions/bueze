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
  FileText
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalLeads: number;
  activeLeads: number;
}

interface PendingHandwerker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  created_at: string;
  categories: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalLeads: 0,
    activeLeads: 0,
  });
  const [recentPending, setRecentPending] = useState<PendingHandwerker[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
        .maybeSingle();

      if (!roleData || roleData.role !== 'admin') {
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
      // Get handwerker stats
      const { data: handwerkerData, error: handwerkerError } = await supabase
        .from('handwerker_profiles')
        .select('id, verification_status, first_name, last_name, email, company_name, created_at, categories');

      if (handwerkerError) throw handwerkerError;

      const pending = handwerkerData?.filter(h => h.verification_status === 'pending') || [];
      const approved = handwerkerData?.filter(h => h.verification_status === 'approved') || [];
      const rejected = handwerkerData?.filter(h => h.verification_status === 'rejected') || [];

      // Get lead stats
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, status');

      if (leadsError) throw leadsError;

      const activeLeads = leadsData?.filter(l => l.status === 'active') || [];

      setStats({
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        totalLeads: leadsData?.length || 0,
        activeLeads: activeLeads.length,
      });

      // Get recent 5 pending handwerkers
      setRecentPending(
        pending
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(h => ({
            id: h.id,
            first_name: h.first_name,
            last_name: h.last_name,
            email: h.email,
            company_name: h.company_name,
            created_at: h.created_at,
            categories: h.categories || [],
          }))
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Fehler',
        description: 'Dashboard-Daten konnten nicht geladen werden.',
        variant: 'destructive',
      });
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
            <h1 className="text-3xl font-bold text-ink-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-ink-600">
              Übersicht und Verwaltung der Plattform
            </p>
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/handwerker-verification')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Alle Handwerker verwalten
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Plattform-Aktivität
                </CardTitle>
                <CardDescription>
                  Letzte 30 Tage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Neue Registrierungen</span>
                  <span className="font-semibold">{stats.pendingCount + stats.approvedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Neue Aufträge</span>
                  <span className="font-semibold">{stats.totalLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktive Aufträge</span>
                  <span className="font-semibold">{stats.activeLeads}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Pending Handwerkers */}
          {stats.pendingCount > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Neueste ausstehende Registrierungen</CardTitle>
                    <CardDescription>
                      Kürzlich eingereichte Handwerker-Profile
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/approvals')}
                  >
                    Alle anzeigen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPending.map((handwerker) => (
                    <div 
                      key={handwerker.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {handwerker.first_name} {handwerker.last_name}
                          </p>
                          {handwerker.company_name && (
                            <span className="text-sm text-muted-foreground">
                              • {handwerker.company_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {handwerker.email}
                        </p>
                        <div className="flex flex-wrap gap-1">
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
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {formatDate(handwerker.created_at)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => navigate('/admin/approvals')}
                        >
                          Prüfen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
