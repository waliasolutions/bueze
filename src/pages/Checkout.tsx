import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Smartphone, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlanType,
  formatPrice,
  formatPricePerMonth 
} from "@/config/subscriptionPlans";

type PaymentMethod = "card" | "twint";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") as SubscriptionPlanType || "monthly";
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>(planParam);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  const handleCheckout = async () => {
    setIsProcessing(true);
    // TODO: Implement Stripe/Twint payment processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/profile?tab=subscription&success=true");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <h1 className="text-4xl font-bold mb-2">Abonnement abschliessen</h1>
          <p className="text-muted-foreground">
            Wählen Sie Ihren Plan und Ihre Zahlungsmethode
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Plan Selection & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Plan auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie das Abonnement, das am besten zu Ihren Bedürfnissen passt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={(value) => setSelectedPlan(value as SubscriptionPlanType)}
                  className="space-y-3"
                >
                  {Object.values(SUBSCRIPTION_PLANS).map((planOption) => (
                    <div
                      key={planOption.id}
                      className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        selectedPlan === planOption.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedPlan(planOption.id)}
                    >
                      <RadioGroupItem
                        value={planOption.id}
                        id={planOption.id}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Label
                            htmlFor={planOption.id}
                            className="text-lg font-semibold cursor-pointer flex items-center gap-2"
                          >
                            {planOption.displayName}
                            {planOption.popular && (
                              <Badge variant="default">Beliebt</Badge>
                            )}
                            {planOption.savings && (
                              <Badge variant="secondary">{planOption.savings}</Badge>
                            )}
                          </Label>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {planOption.price === 0 ? "Kostenlos" : formatPrice(planOption.price)}
                            </div>
                            {planOption.billingCycle && (
                              <div className="text-sm text-muted-foreground">
                                {formatPrice(planOption.pricePerMonth)}/Monat
                              </div>
                            )}
                          </div>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {planOption.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            {plan.price > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Zahlungsmethode wählen</CardTitle>
                  <CardDescription>
                    Wählen Sie, wie Sie bezahlen möchten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid sm:grid-cols-2 gap-4"
                  >
                    {/* Credit Card */}
                    <div
                      className={`relative flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <RadioGroupItem
                        value="card"
                        id="card"
                        className="absolute top-4 right-4"
                      />
                      <CreditCard className="h-12 w-12 mb-3 text-primary" />
                      <Label
                        htmlFor="card"
                        className="text-lg font-semibold cursor-pointer mb-1"
                      >
                        Kreditkarte
                      </Label>
                      <p className="text-sm text-muted-foreground text-center">
                        Visa, Mastercard, Amex
                      </p>
                    </div>

                    {/* Twint */}
                    <div
                      className={`relative flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all ${
                        paymentMethod === "twint"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("twint")}
                    >
                      <RadioGroupItem
                        value="twint"
                        id="twint"
                        className="absolute top-4 right-4"
                      />
                      <Smartphone className="h-12 w-12 mb-3 text-primary" />
                      <Label
                        htmlFor="twint"
                        className="text-lg font-semibold cursor-pointer mb-1"
                      >
                        TWINT
                      </Label>
                      <p className="text-sm text-muted-foreground text-center">
                        Schnell & sicher
                      </p>
                    </div>
                  </RadioGroup>

                  {/* Payment Details Form */}
                  {paymentMethod === "card" && (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Kartennummer</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Ablaufdatum</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            placeholder="123"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Karteninhaber</Label>
                        <Input
                          id="name"
                          placeholder="Max Mustermann"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "twint" && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-center text-muted-foreground">
                        Sie werden nach dem Klick auf "Jetzt bezahlen" zur TWINT-App weitergeleitet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{plan.displayName}</p>
                      {plan.billingCycle && (
                        <p className="text-sm text-muted-foreground">
                          {plan.billingCycle === 'monthly' && 'Monatlich'}
                          {plan.billingCycle === '6_month' && '6 Monate'}
                          {plan.billingCycle === 'annual' && 'Jährlich'}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">
                      {plan.price === 0 ? "CHF 0" : formatPrice(plan.price)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-3">Enthaltene Leistungen:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {plan.price > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Zwischensumme</span>
                        <span>{formatPrice(plan.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>MwSt. (8.1%)</span>
                        <span>{formatPrice(Math.round(plan.price * 0.081))}</span>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {plan.price === 0 
                      ? "CHF 0" 
                      : formatPrice(Math.round(plan.price * 1.081))
                    }
                  </span>
                </div>

                {plan.billingCycle && plan.price > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Entspricht {formatPrice(plan.pricePerMonth)} pro Monat
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Wird verarbeitet..." : "Jetzt bezahlen"}
                </Button>
                
                {plan.price === 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/profile")}
                  >
                    Kostenlos starten
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Mit dem Abschluss akzeptieren Sie unsere{" "}
                  <a href="#" className="underline hover:text-primary">
                    AGB
                  </a>{" "}
                  und{" "}
                  <a href="#" className="underline hover:text-primary">
                    Datenschutzrichtlinien
                  </a>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
