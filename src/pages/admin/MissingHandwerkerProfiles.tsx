import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ManagementPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getRoleBadgeVariant, getRoleLabelShort, type AppRole } from '@/config/roles';
import { Search, RefreshCw, Loader2, Wrench, TriangleAlert, Mail, Phone } from 'lucide-react';
import { formatPhoneDisplay, formatPhoneHref } from '@/lib/displayFormatters';

interface MissingHandwerkerUser {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: AppRole[];
}

export default function MissingHandwerkerProfiles() {
  const { toast } = useToast();
  const { isChecking, hasChecked, isAuthorized } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<MissingHandwerkerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-handwerker-recovery', {
        body: { action: 'list' },
      });

      if (error) throw error;

      setUsers(data?.users || []);
    } catch (error: any) {
      console.error('Error loading missing handwerker profiles:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Wiederherstellungsliste konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasChecked && isAuthorized) {
      loadUsers();
    }
  }, [hasChecked, isAuthorized]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      user.email.toLowerCase().includes(term) ||
      user.fullName?.toLowerCase().includes(term) ||
      user.roles.some((role) => role.toLowerCase().includes(term))
    );
  }, [searchTerm, users]);

  const handleSetup = async (user: MissingHandwerkerUser) => {
    setActionLoading(user.userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-handwerker-recovery', {
        body: { action: 'setup', userId: user.userId },
      });

      if (error) throw error;

      setUsers((prev) => prev.filter((entry) => entry.userId !== user.userId));
      toast({
        title: 'Profil angelegt',
        description: data?.message || `Das fehlende Handwerker-Profil für ${user.email} wurde erstellt.`,
      });
    } catch (error: any) {
      console.error('Error creating missing handwerker profile:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Das Handwerker-Profil konnte nicht angelegt werden.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const isReady = hasChecked && isAuthorized && !loading;

  if (isChecking && !hasChecked) {
    return (
      <AdminLayout title="Profil-Lücken" description="Auth-Konten ohne Handwerker-Profil finden und reparieren">
        <ManagementPageSkeleton />
      </AdminLayout>
    );
  }

  if (!isAuthorized) return null;

  return (
    <AdminLayout
      title="Profil-Lücken"
      description="Auth-Konten ohne handwerker_profiles erkennen und mit einem Klick als Handwerker-Setup vorbereiten"
      isLoading={!isReady}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Fehlende Profile</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Mit Handwerker-Rolle</p>
            <p className="text-2xl font-bold">{users.filter((user) => user.roles.includes('handwerker')).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ohne Rollen-Hinweis</p>
            <p className="text-2xl font-bold">{users.filter((user) => !user.roles.includes('handwerker')).length}</p>
          </CardContent>
        </Card>
      </div>

      <Alert className="mb-6">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>
          Die Aktion erstellt ein fehlendes <code>handwerker_profiles</code>-Profil im Status <strong>pending</strong> und ergänzt die <strong>Handwerker</strong>-Rolle, ohne einen zweiten Registrierungsweg einzuführen.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nach Name, E-Mail oder Rolle suchen..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={loadUsers} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Rollen</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Letzter Login</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {users.length === 0 ? 'Keine Auth-Konten ohne Handwerker-Profil gefunden.' : 'Keine passenden Einträge gefunden.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName || 'Kein Name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                                {getRoleLabelShort(role)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="text-xs">Keine Rolle</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <a href={`mailto:${user.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </a>
                          {user.phone ? (
                            <a href={formatPhoneHref(user.phone)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <Phone className="h-3 w-3" />
                              {formatPhoneDisplay(user.phone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Keine Telefonnummer</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('de-CH')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('de-CH') : 'Noch nie'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleSetup(user)} disabled={actionLoading === user.userId}>
                          {actionLoading === user.userId ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Wrench className="h-4 w-4 mr-2" />
                          )}
                          Setup anlegen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}