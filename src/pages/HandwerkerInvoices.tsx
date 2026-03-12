import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, FileText, Receipt, Loader2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getInvoiceStatusConfig, formatInvoiceAmount } from '@/config/invoiceConfig';
import { getPlanLabel, PLAN_BADGE_VARIANT } from '@/config/subscriptionPlans';
import type { Invoice } from '@/types/entities';

const HandwerkerInvoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;

    const fetchInvoices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('issued_at', { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setInvoices((data as Invoice[]) || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        if (isMounted) {
          toast({
            title: 'Fehler',
            description: 'Quittungen konnten nicht geladen werden.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInvoices();
    return () => { isMounted = false; };
  }, [navigate, toast]);

  // Distinct months from invoice data
  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();
    invoices.forEach((inv) => {
      const key = format(new Date(inv.issued_at), 'yyyy-MM');
      if (!months.has(key)) {
        months.set(key, format(new Date(inv.issued_at), 'MMMM yyyy', { locale: de }));
      }
    });
    return Array.from(months.entries()).map(([value, label]) => ({ value, label }));
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (selectedMonth === 'all') return invoices;
    return invoices.filter((inv) => {
      return format(new Date(inv.issued_at), 'yyyy-MM') === selectedMonth;
    });
  }, [invoices, selectedMonth]);

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (!invoice.pdf_storage_path) {
      toast({
        title: 'PDF nicht verfügbar',
        description: 'Die Quittung wird noch erstellt. Bitte versuchen Sie es später erneut.',
      });
      return;
    }

    setDownloadingId(invoice.id);
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .createSignedUrl(invoice.pdf_storage_path, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download fehlgeschlagen',
        description: 'Die Quittung konnte nicht heruntergeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Stats from filtered invoices
  const totalPaid = filteredInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const invoiceCount = filteredInvoices.length;
  const latestDate = filteredInvoices[0]?.issued_at;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/handwerker-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück zum Dashboard
          </Button>

          {/* Page title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Meine Quittungen
              </h1>
              <p className="text-muted-foreground mt-1">
                Übersicht aller Quittungen für Ihr Abonnement
              </p>
            </div>
            {invoices.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {invoices.length} {invoices.length === 1 ? 'Quittung' : 'Quittungen'}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  title="Noch keine Quittungen"
                  description="Sobald Sie ein Abonnement abschliessen, erscheinen Ihre Quittungen hier."
                  icon={FileText}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total bezahlt</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatInvoiceAmount(totalPaid)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Quittungen</p>
                    <p className="text-2xl font-bold">{invoiceCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Letzte Quittung</p>
                    <p className="text-2xl font-bold">
                      {latestDate
                        ? format(new Date(latestDate), 'dd.MM.yyyy', { locale: de })
                        : '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Month filter */}
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Monat wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Monate</SelectItem>
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice table */}
              <Card>
                <CardHeader>
                  <CardTitle>Quittungsübersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Keine Quittungen in diesem Monat.
                    </p>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quittungsnr.</TableHead>
                              <TableHead>Datum</TableHead>
                              <TableHead>Abo-Typ</TableHead>
                              <TableHead>Betrag</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">PDF</TableHead>
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
                                    {invoice.pdf_storage_path ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadPdf(invoice)}
                                        disabled={downloadingId === invoice.id}
                                      >
                                        {downloadingId === invoice.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            <Download className="h-4 w-4 mr-1" />
                                            PDF
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {filteredInvoices.map((invoice) => {
                          const statusConfig = getInvoiceStatusConfig(invoice.status);
                          return (
                            <div key={invoice.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm text-muted-foreground">
                                  {invoice.invoice_number}
                                </span>
                                <Badge className={statusConfig.className}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(invoice.issued_at), 'dd.MM.yyyy', { locale: de })}
                                  {' · '}
                                  {getPlanLabel(invoice.plan_type)}
                                </span>
                                <span className="font-semibold">
                                  {formatInvoiceAmount(invoice.amount, invoice.currency)}
                                </span>
                              </div>
                              {invoice.pdf_storage_path && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleDownloadPdf(invoice)}
                                  disabled={downloadingId === invoice.id}
                                >
                                  {downloadingId === invoice.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  PDF herunterladen
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerInvoices;
