import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone } from "lucide-react";
import { PaymentProvider } from "@/config/payrexx";

interface PaymentMethodSelectorProps {
  value: PaymentProvider;
  onChange: (value: PaymentProvider) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(val) => onChange(val as PaymentProvider)}
      className="space-y-3"
    >
      {/* Payrexx - Swiss payment methods */}
      <div
        className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
          value === 'payrexx'
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onChange('payrexx')}
      >
        <RadioGroupItem value="payrexx" id="payrexx" className="mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="payrexx" className="text-base font-semibold cursor-pointer">
              Schweizer Zahlungsmethoden
            </Label>
            <Badge variant="default" className="text-xs">Empfohlen</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              TWINT
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              PostFinance
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Kreditkarte
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Zahlen Sie bequem mit Schweizer Zahlungsmethoden
          </p>
        </div>
      </div>

      {/* Stripe - International */}
      <div
        className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
          value === 'stripe'
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onChange('stripe')}
      >
        <RadioGroupItem value="stripe" id="stripe" className="mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="stripe" className="text-base font-semibold cursor-pointer">
              Internationale Kreditkarten
            </Label>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Visa
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Mastercard
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              American Express
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Für internationale Kreditkarten über Stripe
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}
