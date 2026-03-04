import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PaymentMethodCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Zahlungsmethoden
        </CardTitle>
        <CardDescription>
          Ihre Zahlungsmethoden werden sicher über unseren Zahlungspartner Payrexx verwaltet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigate('/checkout')}
        >
          <ExternalLink className="h-4 w-4" />
          Zahlungsmethoden verwalten
        </Button>
      </CardContent>
    </Card>
  );
};
