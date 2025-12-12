import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlanType,
  formatPrice,
} from "@/config/subscriptionPlans";

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") as SubscriptionPlanType || "monthly";
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>(planParam);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Silent redirect - the redirect URL itself indicates the intent
      navigate("/auth?redirect=/checkout?plan=" + selectedPlan);
      return;
    }
    setIsAuthenticated(true);
  };

  const handleCheckout = async () => {
    if (plan.price === 0) {
      // Free plan - just navigate to profile
      navigate("/profile?tab=subscription");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planType: selectedPlan,
          successUrl: `${window.location.origin}/profile?tab=subscription&success=true`,
          cancelUrl: `${window.location.origin}/checkout?plan=${selectedPlan}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            Wählen Sie Ihren Plan und fahren Sie mit der Zahlung fort
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Plan Selection */}
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

            {/* Payment Info */}
            {plan.price > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    2. Sichere Zahlung
                  </CardTitle>
                  <CardDescription>
                    Sie werden zu unserem sicheren Zahlungspartner Stripe weitergeleitet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Wir akzeptieren alle gängigen Zahlungsmethoden:
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        Kreditkarte (Visa, Mastercard)
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Ihre Zahlungsdaten werden sicher von Stripe verarbeitet und niemals auf unseren Servern gespeichert.
                    </p>
                  </div>
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
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird weitergeleitet...
                    </>
                  ) : plan.price === 0 ? (
                    "Kostenlos starten"
                  ) : (
                    "Zur Zahlung"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Mit dem Abschluss akzeptieren Sie unsere{" "}
                  <a href="/legal/agb" className="underline hover:text-primary">
                    AGB
                  </a>{" "}
                  und{" "}
                  <a href="/datenschutz" className="underline hover:text-primary">
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
