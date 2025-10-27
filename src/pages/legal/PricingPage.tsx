import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

const PricingPage = () => {
  const plans = [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.monthly,
    SUBSCRIPTION_PLANS['6_month'],
    SUBSCRIPTION_PLANS.annual
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-ink-900 mb-4">Preise für Handwerker</h1>
            <p className="text-xl text-ink-700">
              Transparente Preise – zahlen Sie nur für das, was Sie wirklich nutzen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.id === 'monthly' ? 'border-2 border-brand-600' : ''}>
                <CardHeader>
                  {plan.id === 'monthly' && (
                    <Badge className="w-fit mb-2">Beliebt</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-ink-900">
                      {plan.price === 0 ? 'Gratis' : `CHF ${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/Monat</span>}
                  </CardDescription>
                  {plan.id === '6_month' && (
                    <p className="text-sm text-brand-600 font-medium">Spare 10%</p>
                  )}
                  {plan.id === 'annual' && (
                    <p className="text-sm text-brand-600 font-medium">Spare 20%</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-ink-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lead-Ansichten:</span>
                      <span className="font-semibold text-ink-900">
                        {plan.viewsLimit === -1 ? 'Unbegrenzt' : plan.viewsLimit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preis pro Lead:</span>
                      <span className="font-semibold text-ink-900">CHF {plan.leadPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Häufig gestellte Fragen zu den Preisen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-ink-900 mb-2">Was bedeutet "Lead-Ansichten"?</h3>
                <p className="text-ink-700">
                  Lead-Ansichten sind die Anzahl der Kundenanfragen, die Sie im Detail ansehen können. 
                  Im kostenlosen Plan sehen Sie Basis-Informationen (Ort, PLZ, Kategorie, Budget). 
                  Mit einem Abo erhalten Sie Zugang zu vollständigen Kontaktdaten.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ink-900 mb-2">Was passiert, wenn ich mein Limit erreiche?</h3>
                <p className="text-ink-700">
                  Sie können jederzeit zusätzliche Leads einzeln kaufen oder auf ein höheres Abo upgraden. 
                  Die Preise für zusätzliche Leads sind im jeweiligen Plan aufgeführt.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ink-900 mb-2">Kann ich mein Abo jederzeit wechseln?</h3>
                <p className="text-ink-700">
                  Ja, Sie können jederzeit upgraden. Bei einem Downgrade gilt die Änderung ab der nächsten Abrechnungsperiode.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ink-900 mb-2">Gibt es versteckte Kosten?</h3>
                <p className="text-ink-700">
                  Nein. Alle Preise sind transparent und werden Ihnen vor jedem Kauf klar angezeigt. 
                  Sie zahlen nur für das, was Sie auswählen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ink-900 mb-2">Wie funktioniert die Zahlung?</h3>
                <p className="text-ink-700">
                  Zahlungen erfolgen sicher per Kreditkarte. Ihr Abo wird automatisch verlängert, 
                  Sie können aber jederzeit kündigen.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-ink-700 mb-4">
              Haben Sie weitere Fragen? Kontaktieren Sie uns gerne.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
