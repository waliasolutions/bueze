import { Fragment, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailSendLog } from '@/components/admin/EmailSendLog';
import { formatDateTime } from '@/lib/swissTime';
import { ErrorCategory } from '@/lib/errorCategories';


interface ErrorLogRow {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  context: string;
  category: string;
  severity: string;
  message: string;
  detail: string | null;
  route: string | null;
  user_agent: string | null;
  correlation_id: string | null;
  metadata: Record<string, unknown> | null;
}

const RANGES = [
  { value: '1', label: 'Letzte 24 Stunden' },
  { value: '7', label: 'Letzte 7 Tage' },
  { value: '30', label: 'Letzte 30 Tage' },
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

const severityVariant = (severity: string): 'secondary' | 'outline' | 'destructive' => {
  if (severity === 'critical' || severity === 'high') return 'destructive';
  if (severity === 'medium') return 'secondary';
  return 'outline';
};

export default function ErrorLog() {
  const [rows, setRows] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [range, setRange] = useState('7');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    setLoadError(null);

    const since = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('app_error_log')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    if (category !== 'all') query = query.eq('category', category);
    if (severity !== 'all') query = query.eq('severity', severity);

    const { data, error } = await query;

    if (error) {
      setLoadError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as ErrorLogRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, category, severity]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.user_email, row.message, row.detail, row.context, row.route]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [rows, search]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => counts.set(row.category, (counts.get(row.category) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Fehlerlog
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload- und Speicherfehler der App, neueste zuerst. Aufbewahrung 90 Tage.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRows} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>
      <Tabs defaultValue="errors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="errors">Fehler</TabsTrigger>
          <TabsTrigger value="emails">E-Mail-Versand</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-6">
      <Card>

        <CardHeader className="pb-3">
          <CardTitle className="text-base">Häufigkeit im gewählten Zeitraum</CardTitle>
          <CardDescription>
            {rows.length} Fehler total {categoryCounts.length === 0 && '– aktuell keine Einträge'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {categoryCounts.map(([cat, count]) => (
            <Badge key={cat} variant="secondary" className="break-words">
              {cat}: {count}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="E-Mail, Meldung, Aktion oder Seite suchen"
                className="pl-9"
              />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {Object.values(ErrorCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Schweregrad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Schweregrade</SelectItem>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadError && (
            <p className="text-sm text-destructive break-words">
              Fehlerlog konnte nicht geladen werden: {loadError}
            </p>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Keine Fehler im gewählten Zeitraum.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Zeitpunkt</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Schweregrad</TableHead>
                    <TableHead>Meldung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      >
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTime(row.created_at)}
                        </TableCell>
                        <TableCell className="text-sm break-words max-w-[200px]">
                          {row.user_email || <span className="text-muted-foreground">Gast</span>}
                        </TableCell>
                        <TableCell className="text-sm break-words max-w-[180px]">{row.context}</TableCell>
                        <TableCell className="text-sm break-words max-w-[160px]">{row.category}</TableCell>
                        <TableCell>
                          <Badge variant={severityVariant(row.severity)}>{row.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-sm break-words max-w-[280px]">{row.message}</TableCell>
                      </TableRow>
                      {expanded === row.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/40">
                            <dl className="grid gap-2 text-sm sm:grid-cols-2">
                              <div className="min-w-0">
                                <dt className="text-muted-foreground">Technische Meldung</dt>
                                <dd className="break-words font-mono text-xs">{row.detail || '—'}</dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-muted-foreground">Seite</dt>
                                <dd className="break-words">{row.route || '—'}</dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-muted-foreground">Browser / Gerät</dt>
                                <dd className="break-words text-xs">{row.user_agent || '—'}</dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-muted-foreground">Korrelations-ID</dt>
                                <dd className="break-words font-mono text-xs">{row.correlation_id || '—'}</dd>
                              </div>
                              <div className="min-w-0 sm:col-span-2">
                                <dt className="text-muted-foreground">Zusatzinfos</dt>
                                <dd className="break-words font-mono text-xs whitespace-pre-wrap">
                                  {JSON.stringify(row.metadata ?? {}, null, 2)}
                                </dd>
                              </div>
                            </dl>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="emails">
          <EmailSendLog />
        </TabsContent>
      </Tabs>
    </div>

  );
}
