import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { getCategoryLabel } from '@/config/categoryLabels';
import { getCantonLabel } from '@/config/cantons';
import { calculateProfileCompleteness } from '@/lib/profileCompleteness';
import { HandwerkerProfileModal } from '@/components/HandwerkerProfileModal';
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  Building2,
  MapPin,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Handwerker {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  categories: string[];
  service_areas: string[];
  verification_status: string;
  is_verified: boolean;
  created_at: string;
  bio: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  logo_url: string | null;
  uid_number: string | null;
  iban: string | null;
  portfolio_urls: string[];
  business_canton: string | null;
  business_city: string | null;
}

interface Subscription {
  user_id: string;
  plan_type: string;
  proposals_used_this_period: number;
  proposals_limit: number;
}

export default function HandwerkerManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [handwerkers, setHandwerkers] = useState<Handwerker[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map());
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedHandwerkerId, setSelectedHandwerkerId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Sie haben keine Berechtigung für diese Seite.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [roleLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchHandwerkers();
      fetchSubscriptions();
    }
  }, [isAdmin]);

  const fetchHandwerkers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('handwerker_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHandwerkers(data || []);
    } catch (error) {
      console.error('Error fetching handwerkers:', error);
      toast({
        title: 'Fehler',
        description: 'Handwerker konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_subscriptions')
        .select('user_id, plan_type, proposals_used_this_period, proposals_limit');

      if (error) throw error;
      const subsMap = new Map<string, Subscription>();
      data?.forEach((sub) => {
        subsMap.set(sub.user_id, sub);
      });
      setSubscriptions(subsMap);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const getFilteredHandwerkers = () => {
    let filtered = handwerkers;

    // Filter by tab (status)
    if (activeTab !== 'all') {
      filtered = filtered.filter((h) => h.verification_status === activeTab);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.first_name?.toLowerCase().includes(term) ||
          h.last_name?.toLowerCase().includes(term) ||
          h.company_name?.toLowerCase().includes(term) ||
          h.email?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((h) => h.categories.includes(categoryFilter));
    }

    return filtered;
  };

  const getCompleteness = (handwerker: Handwerker) => {
    return calculateProfileCompleteness({
      first_name: handwerker.first_name,
      last_name: handwerker.last_name,
      email: handwerker.email,
      phone_number: handwerker.phone_number,
      company_name: handwerker.company_name,
      bio: handwerker.bio,
      hourly_rate_min: handwerker.hourly_rate_min,
      hourly_rate_max: handwerker.hourly_rate_max,
      service_areas: handwerker.service_areas,
      portfolio_urls: handwerker.portfolio_urls,
      logo_url: handwerker.logo_url,
      uid_number: handwerker.uid_number,
      iban: handwerker.iban,
    });
  };

  const approveHandwerker = async (handwerker: Handwerker) => {
    setActionLoading(handwerker.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('handwerker_profiles')
        .update({
          verification_status: 'approved',
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq('id', handwerker.id);

      if (error) throw error;

      // Create subscription and update role
      if (handwerker.user_id) {
        await Promise.all([
          supabase.from('user_roles').upsert({
            user_id: handwerker.user_id,
            role: 'handwerker',
          }, { onConflict: 'user_id,role' }),
          supabase.from('handwerker_subscriptions').upsert({
            user_id: handwerker.user_id,
            plan_type: 'free',
            proposals_limit: 5,
            proposals_used_this_period: 0,
          }, { onConflict: 'user_id' }),
        ]);

        // Send approval email
        supabase.functions.invoke('send-approval-email', {
          body: {
            userId: handwerker.user_id,
            userName: `${handwerker.first_name} ${handwerker.last_name}`,
            userEmail: handwerker.email,
          },
        }).catch((err) => console.error('Email error:', err));
      }

      toast({ title: 'Handwerker freigeschaltet' });
      fetchHandwerkers();
    } catch (error) {
      console.error('Error approving:', error);
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const rejectHandwerker = async (handwerker: Handwerker) => {
    const reason = prompt('Grund für Ablehnung (optional):');
    setActionLoading(handwerker.id);
    try {
      const { error } = await supabase
        .from('handwerker_profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', handwerker.id);

      if (error) throw error;

      // Send rejection email
      supabase.functions.invoke('send-rejection-email', {
        body: {
          email: handwerker.email,
          firstName: handwerker.first_name,
          lastName: handwerker.last_name,
          companyName: handwerker.company_name,
          reason: reason || undefined,
        },
      }).catch((err) => console.error('Email error:', err));

      toast({ title: 'Handwerker abgelehnt' });
      fetchHandwerkers();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Ausstehend</Badge>;
      case 'approved':
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Aktiv</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Abgelehnt</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSubscriptionBadge = (userId: string | null) => {
    if (!userId) return null;
    const sub = subscriptions.get(userId);
    if (!sub) return <Badge variant="outline">Kein Abo</Badge>;
    
    const isPaid = sub.plan_type !== 'free';
    return (
      <Badge variant={isPaid ? 'default' : 'secondary'}>
        {isPaid ? 'Premium' : 'Free'} ({sub.proposals_used_this_period}/{sub.proposals_limit})
      </Badge>
    );
  };

  const filteredHandwerkers = getFilteredHandwerkers();
  const counts = {
    all: handwerkers.length,
    pending: handwerkers.filter((h) => h.verification_status === 'pending').length,
    approved: handwerkers.filter((h) => h.verification_status === 'approved').length,
    rejected: handwerkers.filter((h) => h.verification_status === 'rejected').length,
  };

  if (roleLoading || loading) {
    return (
      <AdminLayout title="Handwerker" description="Verwalten Sie alle Handwerker-Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Handwerker" description="Verwalten Sie alle Handwerker-Profile">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setActiveTab('all')}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Gesamt</p>
            <p className="text-2xl font-bold">{counts.all}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-l-4 border-l-amber-500" onClick={() => setActiveTab('pending')}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ausstehend</p>
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-l-4 border-l-green-500" onClick={() => setActiveTab('approved')}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Aktiv</p>
            <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-l-4 border-l-red-500" onClick={() => setActiveTab('rejected')}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Abgelehnt</p>
            <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name, Firma oder E-Mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="bau_renovation">Bau & Renovation</SelectItem>
                <SelectItem value="elektroinstallationen">Elektro</SelectItem>
                <SelectItem value="sanitaer">Sanitär</SelectItem>
                <SelectItem value="heizung_klima">Heizung & Klima</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchHandwerkers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Alle ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Aktiv ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Abgelehnt ({counts.rejected})</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Handwerker</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Kategorien</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abo</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHandwerkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Keine Handwerker gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHandwerkers.map((h) => {
                    const completeness = getCompleteness(h);
                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {h.logo_url ? (
                              <img src={h.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {h.first_name} {h.last_name}
                              </p>
                              {h.company_name && (
                                <p className="text-sm text-muted-foreground">{h.company_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {h.email && (
                              <a href={`mailto:${h.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                                <Mail className="h-3 w-3" />
                                {h.email}
                              </a>
                            )}
                            {h.phone_number && (
                              <a href={`tel:${h.phone_number}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                                <Phone className="h-3 w-3" />
                                {h.phone_number}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {h.categories.slice(0, 2).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {getCategoryLabel(cat)}
                              </Badge>
                            ))}
                            {h.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{h.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {h.business_city && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {h.business_city}
                              {h.business_canton && ` (${getCantonLabel(h.business_canton)})`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress value={completeness.percentage} className="h-2" />
                            <span className="text-xs text-muted-foreground">{completeness.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(h.verification_status)}</TableCell>
                        <TableCell>{getSubscriptionBadge(h.user_id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedHandwerkerId(h.user_id)}
                              title="Profil anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {h.verification_status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => approveHandwerker(h)}
                                  disabled={actionLoading === h.id}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Freischalten"
                                >
                                  {actionLoading === h.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => rejectHandwerker(h)}
                                  disabled={actionLoading === h.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Ablehnen"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Profile Modal */}
      {selectedHandwerkerId && (
        <HandwerkerProfileModal
          handwerkerId={selectedHandwerkerId}
          open={!!selectedHandwerkerId}
          onOpenChange={(open) => !open && setSelectedHandwerkerId(null)}
        />
      )}
    </AdminLayout>
  );
}
