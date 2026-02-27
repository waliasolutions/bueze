import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowLeft, Loader2, CreditCard, Smartphone, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  SUBSCRIPTION_PLANS,
  FREE_TIER_PROPOSALS_LIMIT,
  SubscriptionPlanType,
  formatPrice,
} from "@/config/subscriptionPlans";

type ApprovalStatus = 'loading' | 'approved' | 'pending' | 'no_profile' | 'not_authenticated';

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") as SubscriptionPlanType || "monthly";
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>(planParam);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingPendingPlan, setIsSavingPendingPlan] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS[selectedPlan];

  // Show toast if user cancelled payment
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      toast({
        title: 'Zahlung abgebrochen',
        description: 'Sie können den Vorgang jederzeit erneut starten.',
        variant: 'destructive',
      });
    }
  }, []);

  useEffect(() => {
    checkAuthAndApproval();
  }, []);

  const checkAuthAndApproval = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Not authenticated - redirect to auth
      navigate("/auth?redirect=/checkout?plan=" + selectedPlan);
      return;
    }

    setUserId(user.id);

    // Check handwerker profile approval status
    const { data: handwerkerProfile, error } = await supabase
      .from('handwerker_profiles')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus('no_profile');
      return;
    }

    if (!handwerkerProfile) {
      // No handwerker profile - redirect to onboarding with plan param
      setApprovalStatus('no_profile');
      return;
    }

    if (handwerkerProfile.verification_status === 'approved') {
      setApprovalStatus('approved');
    } else {
      setApprovalStatus('pending');
    }
  };

  const handleSavePendingPlan = async () => {
    if (!userId) return;

    setIsSavingPendingPlan(true);
    try {
      // Upsert subscription with pending_plan
      const { error } = await supabase
        .from('handwerker_subscriptions')
        .upsert({
          user_id: userId,
          pending_plan: selectedPlan,
          plan_type: 'free',
          proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
          proposals_used_this_period: 0,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Plan ausgewählt',
        description: 'Nach der Freischaltung Ihres Profils erhalten Sie einen Zahlungslink per E-Mail.',
        duration: 6000,
      });

      navigate('/handwerker-dashboard');
    } catch (error) {
      console.error('Error saving pending plan:', error);
      toast({
        title: 'Fehler',
        description: 'Plan konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPendingPlan(false);
    }
  };

  const handleCheckout = async () => {
    if (plan.price === 0) {
      navigate("/profile?tab=subscription");
      return;
    }

    setIsProcessing(true);

    try {
      const successUrl = `${window.location.origin}/profile?tab=subscription&success=true`;
      const cancelUrl = `${window.location.origin}/checkout?plan=${selectedPlan}&cancelled=true`;

      // Use Payrexx for all payments (Swiss payment methods)
      const { data, error } = await supabase.functions.invoke('create-payrexx-gateway', {
        body: {
          planType: selectedPlan,
          successUrl,
          cancelUrl,
        },
      });

      if (error) throw error;

      if (data?.url) {
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

  // Loading state
  if (approvalStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No handwerker profile - redirect to onboarding
  if (approvalStatus === 'no_profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Handwerker-Profil erforderlich
              </CardTitle>
              <CardDescription>
                Um ein Abonnement abzuschliessen, müssen Sie zuerst ein Handwerker-Profil erstellen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie Ihr Profil und wählen Sie dabei Ihren gewünschten Plan. Nach der Freischaltung können Sie das Abonnement abschliessen.
              </p>
              <Button 
                onClick={() => navigate(`/handwerker-onboarding?plan=${selectedPlan}`)}
                className="w-full"
              >
                Handwerker-Profil erstellen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending approval - show info and save pending plan option
  if (approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Profil wird geprüft
              </CardTitle>
              <CardDescription>
                Ihr Handwerker-Profil wird noch von unserem Team geprüft.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sobald Ihr Profil freigeschaltet wurde, erhalten Sie eine E-Mail mit einem direkten Zahlungslink für Ihr ausgewähltes Abonnement.
                </AlertDescription>
              </Alert>

              {/* Selected Plan Summary */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Ausgewählter Plan:</span>
                  <Badge variant="secondary">{plan.displayName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preis:</span>
                  <span className="font-bold text-primary">{formatPrice(plan.price)}</span>
                </div>
                {plan.savings && (
                  <p className="text-sm text-green-600 mt-2">{plan.savings}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSavePendingPlan}
                  disabled={isSavingPendingPlan}
                  className="w-full"
                >
                  {isSavingPendingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    'Plan auswählen & auf Freischaltung warten'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/handwerker-dashboard')}
                  className="w-full"
                >
                  Später entscheiden
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Sie können Ihre Planauswahl jederzeit ändern, solange Sie noch nicht bezahlt haben.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Approved - show normal checkout flow
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
                    Sie werden zu Payrexx weitergeleitet – dem führenden Schweizer Zahlungsanbieter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Verfügbare Schweizer Zahlungsmethoden:
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-4 w-4" />
                        TWINT
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        PostFinance Card
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        PostFinance E-Finance
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        Visa / Mastercard
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Ihre Zahlungsdaten werden sicher verarbeitet und niemals auf unseren Servern gespeichert.
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

                {/* Payment method indicator */}
                {plan.price > 0 && (
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Zahlung via Payrexx (Schweiz)
                    </p>
                  </div>
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
