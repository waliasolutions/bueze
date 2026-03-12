import { useState } from 'react';
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

interface ScanResult {
  table: string;
  count: number;
  details?: string;
}

function reportToRows(report: ScanReport): ScanResult[] {
  return [
    { table: 'Profile', count: report.orphaned_profiles.length, details: report.orphaned_profiles.map(p => p.email).join(', ') },
    { table: 'Benutzerrollen', count: report.orphaned_user_roles.length },
    { table: 'Handwerker-Profile', count: report.orphaned_handwerker_profiles.length, details: report.orphaned_handwerker_profiles.map(p => p.email || p.user_id).join(', ') },
    { table: 'Abonnements', count: report.orphaned_subscriptions.length },
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
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [cleanupDone, setCleanupDone] = useState(false);

  // History from admin_notifications
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

  const rows = scanReport ? reportToRows(scanReport) : [];

  return (
    <AdminLayout title="Verwaiste Datensätze" description="Datensätze finden und bereinigen, die keinem aktiven Benutzer mehr zugeordnet sind.">
      <div className="space-y-6">
        {/* Actions */}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datenbank scannen</CardTitle>
            <CardDescription>
              Sucht nach Einträgen in allen Tabellen, deren zugehöriger Auth-Benutzer nicht mehr existiert.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
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
            {rows.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabelle</TableHead>
                      <TableHead className="text-right">Anzahl</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.table}>
                        <TableCell className="font-medium">{row.table}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{row.count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {row.details || '–'}
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
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-200">Bereinigung erfolgreich abgeschlossen.</p>
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
