import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  Loader2,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Download,
  MoreHorizontal,
  Search,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { startOfMonth, endOfMonth } from '@/lib/swissTime';
import { de } from 'date-fns/locale';
import { getInvoiceStatusConfig, formatInvoiceAmount } from '@/config/invoiceConfig';
import { getPlanLabel, PLAN_BADGE_VARIANT } from '@/config/subscriptionPlans';
import type { InvoiceWithUser } from '@/types/entities';

const AdminInvoices = () => {
  const { isAuthorized } = useAdminAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status update dialog
  const [statusAction, setStatusAction] = useState<{ invoiceId: string; newStatus: string; invoiceNumber: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchInvoices = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      // Fetch invoices first, then enrich with profile data
      // (invoices.user_id references auth.users, not profiles directly)
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .order('issued_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for all unique user_ids
      const userIds = [...new Set((invoiceData || []).map(i => i.user_id))];
      let profileMap: Record<string, { full_name: string | null; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name, email: p.email }]));
        }
      }

      const enriched = (invoiceData || []).map(inv => ({
        ...inv,
        profiles: profileMap[inv.user_id] || null,
      })) as InvoiceWithUser[];

      setInvoices(enriched);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Fehler',
        description: 'Rechnungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchInvoices();
  }, [isAuthorized]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.invoice_number.toLowerCase().includes(q) ||
        i.billing_name.toLowerCase().includes(q) ||
        (i.billing_company && i.billing_company.toLowerCase().includes(q)) ||
        (i.profiles?.full_name && i.profiles.full_name.toLowerCase().includes(q)) ||
        (i.profiles?.email && i.profiles.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [invoices, statusFilter, searchQuery]);

  // Stats
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyRevenue = invoices
    .filter(i => {
      if (i.status !== 'paid') return false;
      const d = new Date(i.issued_at);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const totalInvoices = invoices.length;

  const handleDownloadPdf = async (invoice: InvoiceWithUser) => {
    if (!invoice.pdf_storage_path) {
      toast({ title: 'PDF nicht verfügbar', description: 'Die Rechnung hat noch kein PDF.' });
      return;
    }

    setDownloadingId(invoice.id);
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .createSignedUrl(invoice.pdf_storage_path, 60);

      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: 'Download fehlgeschlagen', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusAction) return;
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: statusAction.newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', statusAction.invoiceId);

      if (error) throw error;

      toast({
        title: 'Status aktualisiert',
        description: `Rechnung ${statusAction.invoiceNumber} wurde als "${getInvoiceStatusConfig(statusAction.newStatus).label}" markiert.`,
      });

      await fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({ title: 'Fehler', description: 'Status konnte nicht aktualisiert werden.', variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
      setStatusAction(null);
    }
  };

  const handleCsvExport = () => {
    const headers = ['Rechnungsnr.', 'Datum', 'Kunde', 'E-Mail', 'Firma', 'Abo-Typ', 'Betrag CHF', 'Status'];
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      format(new Date(i.issued_at), 'dd.MM.yyyy'),
      i.billing_name,
      i.profiles?.email || '',
      i.billing_company || '',
      getPlanLabel(i.plan_type),
      (i.amount / 100).toFixed(2),
      getInvoiceStatusConfig(i.status).label,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rechnungen_${format(now, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Rechnungsverwaltung" isLoading>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Rechnungsverwaltung" description="Alle Rechnungen verwalten und exportieren">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Gesamtumsatz</span>
            </div>
            <p className="text-2xl font-bold">{formatInvoiceAmount(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Diesen Monat</span>
            </div>
            <p className="text-2xl font-bold">{formatInvoiceAmount(monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Rechnungen</span>
            </div>
            <p className="text-2xl font-bold">{totalInvoices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Letzte Rechnung</span>
            </div>
            <p className="text-2xl font-bold">
              {invoices[0]
                ? format(new Date(invoices[0].issued_at), 'dd.MM.yy')
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="paid">Bezahlt</TabsTrigger>
                <TabsTrigger value="cancelled">Storniert</TabsTrigger>
                <TabsTrigger value="refunded">Erstattet</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Rechnungsnr., Name oder E-Mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(true)}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCsvExport}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rechnungen ({filteredInvoices.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <EmptyState
              title="Keine Rechnungen gefunden"
              description={searchQuery ? 'Versuchen Sie eine andere Suche.' : 'Es wurden noch keine Rechnungen erstellt.'}
              icon={FileText}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnungsnr.</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Abo-Typ</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = getInvoiceStatusConfig(invoice.status);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.issued_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {invoice.billing_company || invoice.billing_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.profiles?.email || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={PLAN_BADGE_VARIANT[invoice.plan_type] || 'outline'}>
                            {getPlanLabel(invoice.plan_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatInvoiceAmount(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {invoice.pdf_storage_path && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPdf(invoice)}
                                disabled={downloadingId === invoice.id}
                              >
                                {downloadingId === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invoice.status === 'paid' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => setStatusAction({
                                        invoiceId: invoice.id,
                                        newStatus: 'cancelled',
                                        invoiceNumber: invoice.invoice_number,
                                      })}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Stornieren
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setStatusAction({
                                        invoiceId: invoice.id,
                                        newStatus: 'refunded',
                                        invoiceNumber: invoice.invoice_number,
                                      })}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Erstattet markieren
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(invoice.status === 'cancelled' || invoice.status === 'refunded') && (
                                  <DropdownMenuItem
                                    onClick={() => setStatusAction({
                                      invoiceId: invoice.id,
                                      newStatus: 'paid',
                                      invoiceNumber: invoice.invoice_number,
                                    })}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Zurück auf Bezahlt
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status change confirmation dialog */}
      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Status ändern</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Rechnung <strong>{statusAction?.invoiceNumber}</strong> als
              {' '}<strong>{statusAction ? getInvoiceStatusConfig(statusAction.newStatus).label : ''}</strong> markieren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingStatus}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={updatingStatus}>
              {updatingStatus && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminInvoices;
