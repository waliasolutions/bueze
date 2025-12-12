import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Shield,
  Download
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  plan_type: string;
  status: string;
  payment_date: string;
  invoice_pdf_url: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  avgRevenuePerUser: number;
}

interface PlanBreakdown {
  name: string;
  value: number;
  color: string;
}

const getPlanLabel = (planType: string): string => {
  const labels: Record<string, string> = {
    'free': 'Gratis',
    'monthly': 'Monatlich',
    '6_month': '6 Monate',
    'annual': 'Jährlich',
  };
  return labels[planType] || planType;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Bezahlt</Badge>;
    case 'failed':
      return <Badge variant="destructive">Fehlgeschlagen</Badge>;
    case 'refunded':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Erstattet</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount / 100);
};

const PLAN_COLORS: Record<string, string> = {
  'monthly': 'hsl(var(--chart-1))',
  '6_month': 'hsl(var(--chart-2))',
  'annual': 'hsl(var(--chart-3))',
};

const AdminPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    avgRevenuePerUser: 0,
  });
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
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
      await loadData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setIsRefreshing(true);

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_history')
        .select('*')
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch user profiles for payments
      const userIds = [...new Set(paymentsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const paymentsWithProfiles = paymentsData?.map(payment => ({
        ...payment,
        profiles: profilesMap.get(payment.user_id),
      })) || [];

      setPayments(paymentsWithProfiles);

      // Calculate stats
      const paidPayments = paymentsData?.filter(p => p.status === 'paid') || [];
      const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthlyPayments = paidPayments.filter(p => {
        const date = new Date(p.payment_date);
        return date >= monthStart && date <= monthEnd;
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      // Fetch active subscriptions
      const { data: subscriptionsData } = await supabase
        .from('handwerker_subscriptions')
        .select('plan_type')
        .eq('status', 'active')
        .neq('plan_type', 'free');

      const activeSubscriptions = subscriptionsData?.length || 0;
      const avgRevenuePerUser = activeSubscriptions > 0 
        ? totalRevenue / activeSubscriptions 
        : 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        avgRevenuePerUser,
      });

      // Calculate plan breakdown
      const planCounts: Record<string, number> = {};
      subscriptionsData?.forEach(sub => {
        planCounts[sub.plan_type] = (planCounts[sub.plan_type] || 0) + 1;
      });

      const breakdown = Object.entries(planCounts).map(([name, value]) => ({
        name: getPlanLabel(name),
        value,
        color: PLAN_COLORS[name] || 'hsl(var(--chart-4))',
      }));

      setPlanBreakdown(breakdown);

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: 'Fehler',
        description: 'Zahlungsdaten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <div>
                  <Badge variant="outline" className="mb-2 bg-red-50 text-red-700 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin-Bereich
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground">
                    Zahlungen & Umsatz
                  </h1>
                  <p className="text-muted-foreground">
                    Übersicht aller Zahlungen und Abonnements
                  </p>
                </div>
              </div>
              <Button onClick={loadData} disabled={isRefreshing} variant="outline">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Gesamtumsatz
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {formatAmount(stats.totalRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Alle bezahlten Rechnungen
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Umsatz diesen Monat
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {formatAmount(stats.monthlyRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), 'MMMM yyyy', { locale: de })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aktive Abos
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-purple-600">
                  {stats.activeSubscriptions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bezahlte Abonnements
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ø pro Nutzer
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-amber-600">
                  {formatAmount(stats.avgRevenuePerUser)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Durchschnittlicher Umsatz
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Plan Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Abo-Verteilung
                </CardTitle>
                <CardDescription>
                  Aktive Abonnements nach Typ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {planBreakdown.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {planBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Keine aktiven Abos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Letzte Zahlungen</CardTitle>
                <CardDescription>
                  Die 10 neuesten Transaktionen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <EmptyState
                    title="Keine Zahlungen"
                    description="Es wurden noch keine Zahlungen erfasst."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Nutzer</TableHead>
                        <TableHead>Abo</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 10).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {format(new Date(payment.payment_date), 'dd.MM.yy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {payment.profiles?.full_name || 'Unbekannt'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.profiles?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanLabel(payment.plan_type)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatAmount(payment.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            {payment.invoice_pdf_url ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={payment.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPayments;
