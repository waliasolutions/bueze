import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isDefault: boolean;
  isVerified: boolean;
}

interface PaymentMethodCardProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
  onRemovePaymentMethod: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const getCardIcon = (type: string) => {
  switch (type) {
    case 'visa':
      return <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>;
    case 'mastercard':
      return <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>;
    case 'amex':
      return <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefault
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Zahlungsmethoden
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Zahlungsmethoden für Lead-Käufe und Abonnements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Keine Zahlungsmethoden</p>
            <p className="text-sm mb-4">
              Fügen Sie eine Zahlungsmethode hinzu, um Leads zu kaufen
            </p>
            <Button onClick={onAddPaymentMethod} className="gap-2">
              <Plus className="h-4 w-4" />
              Erste Zahlungsmethode hinzufügen
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCardIcon(method.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          •••• •••• •••• {method.lastFour}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Standard
                          </Badge>
                        )}
                        {method.isVerified ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Verifiziert
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Nicht verifiziert
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.holderName} • Läuft ab {method.expiryMonth}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && method.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(method.id)}
                      >
                        Als Standard festlegen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePaymentMethod(method.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={onAddPaymentMethod}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Weitere Zahlungsmethode hinzufügen
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};