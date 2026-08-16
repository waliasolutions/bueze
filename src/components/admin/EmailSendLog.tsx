import { useEffect, useState } from 'react';
import { Mail, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/swissTime';

interface EmailSendRow {
  id: string;
  created_at: string;
  dedupe_key: string;
  recipient: string;
  bcc: string | null;
  subject: string;
  status: string;
  context: string | null;
  smtp2go_email_id: string | null;
  error_detail: string | null;
}

const statusVariant = (status: string): 'secondary' | 'outline' | 'destructive' | 'default' => {
  if (status === 'failed') return 'destructive';
  if (status === 'sent') return 'default';
  return 'secondary';
};

export function EmailSendLog() {
  const [rows, setRows] = useState<EmailSendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchRows = async () => {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from('email_send_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      setLoadError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as EmailSendRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? rows.filter((row) =>
        [row.recipient, row.subject, row.context, row.dedupe_key, row.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term)),
      )
    : rows;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Empfänger, Betreff oder Sperrschlüssel suchen"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={fetchRows} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0" />
          Jede Mail ist über einen eindeutigen Sperrschlüssel geschützt – ein zweiter Versand derselben
          Mail wird technisch verhindert.
        </p>

        {loadError && (
          <p className="text-sm text-destructive break-words">
            Versandprotokoll konnte nicht geladen werden: {loadError}
          </p>
        )}

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Keine Einträge vorhanden.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Zeitpunkt</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kontext</TableHead>
                  <TableHead>Sperrschlüssel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell className="text-sm break-words max-w-[200px]">{row.recipient}</TableCell>
                    <TableCell className="text-sm break-words max-w-[260px]">{row.subject}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm break-words max-w-[140px]">
                      {row.context || '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono break-all max-w-[220px]">
                      {row.dedupe_key}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
