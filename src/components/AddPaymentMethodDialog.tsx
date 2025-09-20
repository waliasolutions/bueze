import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentMethodAdded: (paymentMethod: any) => void;
}

export const AddPaymentMethodDialog: React.FC<AddPaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  onPaymentMethodAdded
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    billingAddress: '',
    billingZip: '',
    billingCity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      // Format card number with spaces
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (value.length > 19) return; // 16 digits + 3 spaces
    }
    
    if (field === 'cvv' && value.length > 4) return;
    if ((field === 'expiryMonth' || field === 'expiryYear') && value.length > 2) return;
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const detectCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call - In real implementation, this would integrate with Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cardType = detectCardType(formData.cardNumber);
      const lastFour = formData.cardNumber.replace(/\s/g, '').slice(-4);
      
      // Mock payment method object
      const newPaymentMethod = {
        id: Math.random().toString(36).substring(7),
        type: cardType,
        lastFour,
        expiryMonth: formData.expiryMonth.padStart(2, '0'),
        expiryYear: formData.expiryYear,
        holderName: formData.holderName,
        isDefault: false,
        isVerified: Math.random() > 0.3 // 70% chance of verification success
      };

      onPaymentMethodAdded(newPaymentMethod);
      
      toast({
        title: newPaymentMethod.isVerified ? "Zahlungsmethode hinzugefügt" : "Verifizierung erforderlich",
        description: newPaymentMethod.isVerified 
          ? "Ihre Zahlungsmethode wurde erfolgreich hinzugefügt und verifiziert."
          : "Ihre Zahlungsmethode wurde hinzugefügt, aber muss noch verifiziert werden.",
        variant: newPaymentMethod.isVerified ? "default" : "destructive"
      });

      // Reset form
      setFormData({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        holderName: '',
        billingAddress: '',
        billingZip: '',
        billingCity: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Hinzufügen der Zahlungsmethode ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungsmethode hinzufügen
          </DialogTitle>
          <DialogDescription>
            Fügen Sie eine neue Kreditkarte für Lead-Käufe und Abonnements hinzu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Kartennummer</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Monat</Label>
              <Select 
                value={formData.expiryMonth} 
                onValueChange={(value) => handleInputChange('expiryMonth', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Jahr</Label>
              <Select 
                value={formData.expiryYear} 
                onValueChange={(value) => handleInputChange('expiryYear', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="YY" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString().slice(-2)}>
                      {year.toString().slice(-2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="holderName">Karteninhaber</Label>
            <Input
              id="holderName"
              placeholder="Max Mustermann"
              value={formData.holderName}
              onChange={(e) => handleInputChange('holderName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Rechnungsadresse</Label>
            <Input
              id="billingAddress"
              placeholder="Musterstrasse 123"
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingZip">PLZ</Label>
              <Input
                id="billingZip"
                placeholder="8000"
                value={formData.billingZip}
                onChange={(e) => handleInputChange('billingZip', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCity">Stadt</Label>
              <Input
                id="billingCity"
                placeholder="Zürich"
                value={formData.billingCity}
                onChange={(e) => handleInputChange('billingCity', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <Lock className="h-4 w-4" />
            <span>Ihre Daten werden sicher verschlüsselt übertragen</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : null}
              {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};