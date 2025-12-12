import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Loader2, 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle,
  Briefcase,
  FileText,
  AlertCircle,
  RefreshCw,
  Globe,
  Trash2,
  Star,
  CreditCard,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DashboardStats {
  pendingCount: number;
  approvedCount: number;
  totalLeads: number;
  activeLeads: number;
  totalClients: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    approvedCount: 0,
    totalLeads: 0,
    activeLeads: 0,
    totalClients: 0,
    totalRevenue: 0,
  });
  const [isResettingData, setIsResettingData] = useState(false);
  const [attentionItems, setAttentionItems] = useState<{ type: string; count: number; link: string }[]>([]);

  useEffect(() => {
    if (!roleLoading) {
      if (!isAdmin) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie haben keine Berechtigung für diese Seite.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } else {
        loadDashboardData();
        setIsLoading(false);
      }
    }
  }, [roleLoading, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);

      // Fetch handwerker stats
      const { data: handwerkerData } = await supabase
        .from('handwerker_profiles')
        .select('id, verification_status');

      const pending = handwerkerData?.filter(h => h.verification_status === 'pending') || [];
      const approved = handwerkerData?.filter(h => h.verification_status === 'approved') || [];

      // Fetch lead stats
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, status');

      const activeLeads = leadsData?.filter(l => l.status === 'active') || [];

      // Fetch client count
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['client', 'user']);

      // Fetch revenue
      const { data: paymentsData } = await supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'paid');

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        pendingCount: pending.length,
        approvedCount: approved.length,
        totalLeads: leadsData?.length || 0,
        activeLeads: activeLeads.length,
        totalClients: rolesData?.length || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents
      });

      // Set attention items
      const attention: { type: string; count: number; link: string }[] = [];
      if (pending.length > 0) {
        attention.push({ type: 'Handwerker warten auf Freischaltung', count: pending.length, link: '/admin/handwerkers' });
      }
      setAttentionItems(attention);

      toast({
        title: 'Dashboard aktualisiert',
        description: 'Daten erfolgreich geladen.',
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

  const handleResetTestData = async () => {
    try {
      setIsResettingData(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

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

      toast({ title: 'Testdaten gelöscht', description: result.message });
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

  if (isLoading || roleLoading) {
    return (
      <AdminLayout title="Dashboard" description="Übersicht und Schnellzugriff">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Dashboard" description="Übersicht und Schnellzugriff">
      {/* Header Actions */}
      <div className="flex justify-end gap-2 mb-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              disabled={isResettingData}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {isResettingData ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Lösche...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Testdaten löschen</>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Testdaten wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion löscht alle Testbenutzer und deren zugehörige Daten. Diese Aktion kann nicht rückgängig gemacht werden!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetTestData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Ja, Testdaten löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button onClick={loadDashboardData} disabled={isRefreshing} variant="outline">
          {isRefreshing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aktualisiere...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Aktualisieren</>
          )}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/handwerkers')}>
          <CardHeader className="pb-0 sm:pb-1 md:pb-2 p-2 sm:p-3 md:p-6">
            <CardDescription className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">Ausstehend</span>
            </CardDescription>
            <CardTitle className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-600">{stats.pendingCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Handwerker-Freigaben</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/handwerkers')}>
          <CardHeader className="pb-0 sm:pb-1 md:pb-2 p-2 sm:p-3 md:p-6">
            <CardDescription className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">Aktive Handwerker</span>
            </CardDescription>
            <CardTitle className="text-lg sm:text-2xl md:text-3xl font-bold text-green-600">{stats.approvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Freigeschaltet</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/leads')}>
          <CardHeader className="pb-0 sm:pb-1 md:pb-2 p-2 sm:p-3 md:p-6">
            <CardDescription className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
              <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">Aktive Aufträge</span>
            </CardDescription>
            <CardTitle className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-600">{stats.activeLeads}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Von {stats.totalLeads} gesamt</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/payments')}>
          <CardHeader className="pb-0 sm:pb-1 md:pb-2 p-2 sm:p-3 md:p-6">
            <CardDescription className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
              <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">Umsatz</span>
            </CardDescription>
            <CardTitle className="text-base sm:text-xl md:text-2xl font-bold text-purple-600 truncate">CHF {stats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Gesamtumsatz</p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Needed */}
      {attentionItems.length > 0 && (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Handlungsbedarf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {attentionItems.map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-amber-900">
                    <Badge variant="secondary" className="mr-2">{item.count}</Badge>
                    {item.type}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigate(item.link)}>
                    Ansehen <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Benutzer
            </CardTitle>
            <CardDescription>Handwerker und Kunden verwalten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/handwerkers')}>
              <UserCheck className="h-4 w-4 mr-2" />
              Handwerker verwalten
              {stats.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-auto">{stats.pendingCount} ausstehend</Badge>
              )}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/clients')}>
              <Users className="h-4 w-4 mr-2" />
              Kunden verwalten
            </Button>
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inhalte
            </CardTitle>
            <CardDescription>Aufträge, Bewertungen und CMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/leads')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Aufträge & Offerten
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/reviews')}>
              <Star className="h-4 w-4 mr-2" />
              Bewertungen moderieren
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/content')}>
              <FileText className="h-4 w-4 mr-2" />
              CMS Inhalte
            </Button>
          </CardContent>
        </Card>

        {/* Finance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Finanzen
            </CardTitle>
            <CardDescription>Zahlungen und Abonnements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/payments')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Zahlungsübersicht
            </Button>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Einstellungen
            </CardTitle>
            <CardDescription>SEO und Tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/seo')}>
              <Globe className="h-4 w-4 mr-2" />
              SEO Tools
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/gtm')}>
              <Settings className="h-4 w-4 mr-2" />
              GTM Konfiguration
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
