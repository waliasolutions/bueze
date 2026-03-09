import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethodCardProps {
  autoRenew?: boolean;
  currentPeriodEnd?: string | null;
  onAutoRenewChanged?: () => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  autoRenew = false,
  currentPeriodEnd,
  onAutoRenewChanged,
}) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelAutoRenew = async () => {
    setIsCancelling(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-payrexx-subscription');
      if (error) throw error;

      toast({
        title: 'Automatische Verlängerung deaktiviert',
        description: 'Ihr Abonnement bleibt bis zum Ende der aktuellen Laufzeit aktiv.',
      });
      onAutoRenewChanged?.();
    } catch (err: any) {
      console.error('Error cancelling auto-renewal:', err);
      toast({
        title: 'Fehler',
        description: 'Die automatische Verlängerung konnte nicht deaktiviert werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Zahlungsmethoden
          {autoRenew && (
            <Badge variant="default" className="ml-auto bg-green-600 hover:bg-green-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              Automatische Verlängerung aktiv
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Ihre Zahlungsmethoden werden sicher über unseren Zahlungspartner Payrexx verwaltet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {autoRenew ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-800">
                Ihre Zahlung wird automatisch am Ende der Laufzeit erneuert.
              </p>
              {currentPeriodEnd && (
                <p className="text-sm text-green-700">
                  Nächste Verlängerung: {formatDate(currentPeriodEnd)}
                </p>
              )}
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Kreditkartendaten sicher bei Payrexx gespeichert (PCI DSS)
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Sie können die automatische Verlängerung jederzeit deaktivieren
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCancelAutoRenew}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird deaktiviert...
                </>
              ) : (
                'Automatische Verlängerung deaktivieren'
              )}
            </Button>
          </>
        ) : (
          <>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Zahlungsdaten werden direkt bei Payrexx eingegeben und gespeichert
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Sichere Verarbeitung nach Schweizer Standards (PCI DSS)
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Unterstützt TWINT, PostFinance, Kreditkarten und weitere
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Bei Ihrer nächsten Zahlung können Sie eine Zahlungsmethode wählen.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
