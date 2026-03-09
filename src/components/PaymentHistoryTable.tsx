import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Receipt, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getPlanLabel, PLAN_BADGE_VARIANT } from '@/config/subscriptionPlans';
import { formatInvoiceAmount } from '@/config/invoiceConfig';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  plan_type: string;
  status: string;
  payment_date: string;
  invoice_pdf_url: string | null;
  description: string | null;
}

interface PaymentHistoryTableProps {
  userId: string;
}

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


export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', userId)
          .order('payment_date', { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setPayments(data || []);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Zahlungshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Zahlungshistorie
          </CardTitle>
          <CardDescription>
            Übersicht aller Ihrer Zahlungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Noch keine Zahlungen"
            description="Sobald Sie ein Abonnement abschliessen, erscheinen Ihre Zahlungen hier."
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate total paid
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Zahlungshistorie
            </CardTitle>
            <CardDescription>
              Übersicht aller Ihrer Zahlungen
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total bezahlt</p>
            <p className="text-xl font-bold text-green-600">
              {formatInvoiceAmount(totalPaid)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Abo-Typ</TableHead>
              <TableHead>Betrag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rechnung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {format(new Date(payment.payment_date), 'dd. MMMM yyyy', { locale: de })}
                </TableCell>
                <TableCell>
                  <Badge variant={PLAN_BADGE_VARIANT[payment.plan_type] || 'outline'}>
                    {getPlanLabel(payment.plan_type)}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatInvoiceAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell className="text-right">
                  {payment.status === 'paid' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/handwerker-invoices')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Rechnungen
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentHistoryTable;
