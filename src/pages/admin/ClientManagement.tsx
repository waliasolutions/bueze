import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Briefcase,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Client {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  leads_count: number;
  active_leads_count: number;
  last_lead_date: string | null;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
  proposals_count: number;
}

export default function ClientManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientLeads, setClientLeads] = useState<Map<string, Lead[]>>(new Map());
  const [loadingLeads, setLoadingLeads] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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
      fetchClients();
    }
  }, [isAdmin]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch profiles with client/user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name, phone, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles to filter clients
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of roles (exclude handwerkers and admins)
      const clientUserIds = new Set(
        roles
          ?.filter((r) => r.role === 'client' || r.role === 'user')
          .map((r) => r.user_id)
      );

      // Also include users without a role (default to client)
      const usersWithRoles = new Set(roles?.map((r) => r.user_id));

      // Fetch leads count per user
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('owner_id, status, created_at');

      if (leadsError) throw leadsError;

      // Build client data
      const clientsData: Client[] = (profiles || [])
        .filter((p) => clientUserIds.has(p.id) || !usersWithRoles.has(p.id))
        .map((profile) => {
          const userLeads = leads?.filter((l) => l.owner_id === profile.id) || [];
          const activeLeads = userLeads.filter((l) => l.status === 'active');
          const sortedLeads = [...userLeads].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            created_at: profile.created_at,
            leads_count: userLeads.length,
            active_leads_count: activeLeads.length,
            last_lead_date: sortedLeads[0]?.created_at || null,
          };
        });

      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Fehler',
        description: 'Kunden konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientLeads = async (clientId: string) => {
    if (clientLeads.has(clientId)) {
      setExpandedClient(expandedClient === clientId ? null : clientId);
      return;
    }

    setLoadingLeads(clientId);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, title, status, category, created_at, proposals_count')
        .eq('owner_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setClientLeads((prev) => new Map(prev).set(clientId, data || []));
      setExpandedClient(clientId);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Fehler',
        description: 'Aufträge konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoadingLeads(null);
    }
  };

  const deleteClient = async (client: Client) => {
    setDeleteLoading(client.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: client.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({ 
        title: 'Kunde vollständig gelöscht',
        description: `Alle Daten wurden entfernt.`,
      });
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({ 
        title: 'Fehler beim Löschen', 
        description: error.message || 'Unbekannter Fehler',
        variant: 'destructive' 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const getFilteredClients = () => {
    if (!searchTerm) return clients;

    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.email.toLowerCase().includes(term) ||
        c.full_name?.toLowerCase().includes(term) ||
        c.first_name?.toLowerCase().includes(term) ||
        c.last_name?.toLowerCase().includes(term)
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Aktiv</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">Abgeschlossen</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Abgebrochen</Badge>;
      case 'draft':
        return <Badge variant="secondary">Entwurf</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredClients = getFilteredClients();
  const totalLeads = clients.reduce((sum, c) => sum + c.leads_count, 0);
  const activeClients = clients.filter((c) => c.leads_count > 0).length;

  if (roleLoading || loading) {
    return (
      <AdminLayout title="Kunden" description="Verwalten Sie alle Kunden-Konten">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kunden" description="Verwalten Sie alle Kunden-Konten">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Gesamt Kunden</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Aktive Kunden</p>
            <p className="text-2xl font-bold text-green-600">{activeClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Gesamt Aufträge</p>
            <p className="text-2xl font-bold text-blue-600">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ø Aufträge/Kunde</p>
            <p className="text-2xl font-bold">
              {clients.length > 0 ? (totalLeads / clients.length).toFixed(1) : '0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name oder E-Mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchClients}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Aufträge</TableHead>
                <TableHead>Letzte Aktivität</TableHead>
                <TableHead>Registriert</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Keine Kunden gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <>
                    <TableRow key={client.id} className={expandedClient === client.id ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchClientLeads(client.id)}
                          disabled={loadingLeads === client.id}
                          className="h-6 w-6"
                        >
                          {loadingLeads === client.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : expandedClient === client.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Kein Name'}
                            </p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </a>
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.leads_count}</span>
                          {client.active_leads_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {client.active_leads_count} aktiv
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.last_lead_date ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(client.last_lead_date), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString('de-CH')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/leads?owner=${client.id}`)}
                            title="Alle Aufträge anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Endgültig löschen"
                                disabled={deleteLoading === client.id}
                              >
                                {deleteLoading === client.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kunde endgültig löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{client.full_name || client.email}</strong> wird unwiderruflich gelöscht.
                                  <br /><br />
                                  Folgende Daten werden entfernt:
                                  <ul className="list-disc list-inside mt-2 text-sm">
                                    <li>Profil und Konto</li>
                                    <li>Alle {client.leads_count} Aufträge</li>
                                    <li>Alle Nachrichten und Konversationen</li>
                                    <li>Bewertungen</li>
                                  </ul>
                                  <br />
                                  <strong className="text-destructive">Diese Aktion kann nicht rückgängig gemacht werden!</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteClient(client)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Endgültig löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Leads Row */}
                    {expandedClient === client.id && clientLeads.has(client.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium mb-2">Letzte Aufträge:</p>
                            {clientLeads.get(client.id)?.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Keine Aufträge vorhanden</p>
                            ) : (
                              <div className="grid gap-2">
                                {clientLeads.get(client.id)?.map((lead) => (
                                  <div
                                    key={lead.id}
                                    className="flex items-center justify-between p-2 bg-background rounded border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">{lead.title}</span>
                                      {getStatusBadge(lead.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>{lead.proposals_count || 0} Offerten</span>
                                      <span>
                                        {new Date(lead.created_at).toLocaleDateString('de-CH')}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/admin/leads?lead=${lead.id}`)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
