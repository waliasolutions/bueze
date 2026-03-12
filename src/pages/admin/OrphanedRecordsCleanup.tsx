import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Trash2, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ScanReport {
  orphaned_profiles: { id: string; email: string }[];
  orphaned_user_roles: { id: string; user_id: string }[];
  orphaned_handwerker_profiles: { id: string; email: string | null; user_id: string }[];
  orphaned_subscriptions: { id: string; user_id: string }[];
  orphaned_client_notifications: number;
  orphaned_handwerker_notifications: number;
  orphaned_reviews: number;
  orphaned_lead_proposals: number;
  orphaned_lead_views: number;
  orphaned_lead_purchases: number;
  orphaned_leads: number;
  orphaned_magic_tokens: number;
  orphaned_payment_history: number;
  orphaned_handwerker_documents: number;
  orphaned_messages: number;
  orphaned_conversations: number;
  total_orphans: number;
  scan_timestamp: string;
}

interface DetailRow {
  table: string;
  email: string;
  userId: string;
}

interface CountRow {
  table: string;
  count: number;
}

function extractDetailRows(report: ScanReport): DetailRow[] {
  const rows: DetailRow[] = [];

  for (const p of report.orphaned_profiles) {
    rows.push({ table: 'Profile', email: p.email || '–', userId: p.id });
  }
  for (const p of report.orphaned_handwerker_profiles) {
    rows.push({ table: 'Handwerker-Profil', email: p.email || '–', userId: p.user_id });
  }
  for (const r of report.orphaned_user_roles) {
    rows.push({ table: 'Benutzerrolle', email: '–', userId: r.user_id });
  }
  for (const s of report.orphaned_subscriptions) {
    rows.push({ table: 'Abonnement', email: '–', userId: s.user_id });
  }

  return rows;
}

function extractCountRows(report: ScanReport): CountRow[] {
  return [
    { table: 'Kunden-Benachrichtigungen', count: report.orphaned_client_notifications },
    { table: 'Handwerker-Benachrichtigungen', count: report.orphaned_handwerker_notifications },
    { table: 'Bewertungen', count: report.orphaned_reviews },
    { table: 'Offerten', count: report.orphaned_lead_proposals },
    { table: 'Lead-Ansichten', count: report.orphaned_lead_views },
    { table: 'Lead-Käufe', count: report.orphaned_lead_purchases },
    { table: 'Aufträge', count: report.orphaned_leads },
    { table: 'Magic-Tokens', count: report.orphaned_magic_tokens },
    { table: 'Zahlungshistorie', count: report.orphaned_payment_history },
    { table: 'Dokumente', count: report.orphaned_handwerker_documents },
    { table: 'Nachrichten', count: report.orphaned_messages },
    { table: 'Konversationen', count: report.orphaned_conversations },
  ].filter(r => r.count > 0);
}

export default function OrphanedRecordsCleanup() {
  const { role, isChecking } = useAdminAuth();
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [cleanupDone, setCleanupDone] = useState(false);

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['orphan-cleanup-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .in('type', ['orphan_cleanup_completed', 'orphaned_records', 'orphan_cleanup_failed'])
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const handleScan = async () => {
    setScanning(true);
    setScanReport(null);
    setCleanupDone(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht eingeloggt');

      const { data, error } = await supabase.functions.invoke('find-orphaned-records', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setScanReport(data.report);
      toast.success(data.message);
      refetchHistory();
    } catch (err) {
      toast.error(`Scan fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht eingeloggt');

      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-records', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      toast.success(data.message);
      setCleanupDone(true);
      setScanReport(null);
      refetchHistory();
    } catch (err) {
      toast.error(`Bereinigung fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setCleaning(false);
    }
  };

  const detailRows = scanReport ? extractDetailRows(scanReport) : [];
  const countRows = scanReport ? extractCountRows(scanReport) : [];

  if (!isChecking && role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminLayout title="Verwaiste Datensätze" description="Datensätze finden und bereinigen, die keinem aktiven Benutzer mehr zugeordnet sind.">
      <div className="space-y-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datenbank scannen</CardTitle>
            <CardDescription>
              Sucht nach Einträgen in allen Tabellen, deren zugehöriger Auth-Benutzer nicht mehr existiert.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleScan} disabled={scanning || cleaning}>
              {scanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {scanning ? 'Wird gescannt...' : 'Scan starten'}
            </Button>

            {scanReport && scanReport.total_orphans > 0 && !cleanupDone && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={cleaning}>
                    {cleaning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {cleaning ? 'Wird bereinigt...' : `${scanReport.total_orphans} Einträge löschen`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Verwaiste Datensätze löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Es werden <strong>{scanReport.total_orphans} verwaiste Datensätze</strong> unwiderruflich aus der Datenbank gelöscht.
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Endgültig löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* Scan Results */}
        {scanReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {scanReport.total_orphans === 0 ? (
                  <><CheckCircle className="h-5 w-5 text-green-600" /> Keine verwaisten Datensätze</>
                ) : (
                  <><AlertTriangle className="h-5 w-5 text-amber-500" /> {scanReport.total_orphans} verwaiste Datensätze gefunden</>
                )}
              </CardTitle>
              <CardDescription>
                Scan vom {format(new Date(scanReport.scan_timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
              </CardDescription>
            </CardHeader>

            {/* Detail rows: profiles, handwerker, roles, subscriptions — one row per entry */}
            {detailRows.length > 0 && (
              <CardContent className="pt-0">
                <h4 className="text-sm font-medium mb-2">Verwaiste Benutzer-Einträge</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabelle</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead className="hidden sm:table-cell">User-ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailRows.map((row, i) => (
                      <TableRow key={`${row.userId}-${row.table}-${i}`}>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{row.table}</Badge>
                        </TableCell>
                        <TableCell className="text-sm break-all">{row.email}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono break-all">
                          {row.userId}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}

            {/* Count rows: notifications, reviews, etc. */}
            {countRows.length > 0 && (
              <CardContent className={detailRows.length > 0 ? 'pt-0' : ''}>
                <h4 className="text-sm font-medium mb-2">Weitere verwaiste Datensätze</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabelle</TableHead>
                      <TableHead className="text-right">Anzahl</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countRows.map(row => (
                      <TableRow key={row.table}>
                        <TableCell className="font-medium">{row.table}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{row.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )}

        {cleanupDone && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <p className="font-medium">Bereinigung erfolgreich abgeschlossen.</p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verlauf</CardTitle>
              <CardDescription>Letzte Scan- und Bereinigungsergebnisse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
