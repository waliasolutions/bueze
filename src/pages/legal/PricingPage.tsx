import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { usePageContent } from '@/hooks/usePageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { generateFAQSchema, wrapInGraph } from '@/lib/schemaHelpers';

const PricingPage = () => {
  const navigate = useNavigate();
  const { content } = usePageContent('pricing');

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      navigate('/handwerker-onboarding');
    } else {
      navigate(`/checkout?plan=${planId}`);
    }
  };

  const seoData = content?.seo || {
    title: "Preise für Handwerker | Büeze.ch",
    description: "Einfache und faire Preise für Handwerksbetriebe. Starten Sie kostenlos mit 5 Offerten pro Monat oder wählen Sie ein Abo für unbegrenzte Projektanfragen.",
    canonical: "https://bueeze.ch/pricing"
  };

  // Pricing FAQ items
  const pricingFaqItems = [
    { question: 'Was bedeutet "Offerten pro Monat"?', answer: 'Das ist die Anzahl Offerten, die Sie pro Monat einreichen können. Free-Nutzer: 5 Offerten/Monat. Abo-Nutzer: Unbegrenzte Offerten. Am 1. des Monats wird das Kontingent zurückgesetzt.' },
    { question: 'Wie erhalte ich die Kontaktdaten?', answer: 'Nur wenn der Kunde Ihre Offerte akzeptiert. Dann erhalten beide Seiten gleichzeitig die vollständigen Kontaktdaten (Name, Telefon, E-Mail, Adresse) – ohne Zusatzkosten.' },
    { question: 'Was passiert nach 10 Tagen?', answer: 'Jede Anfrage hat eine 10-Tage-Frist für Offerten. Nach Ablauf können keine neuen Offerten mehr eingereicht werden. Der Kunde kann aber weiterhin bereits eingereichte Offerten prüfen und annehmen.' },
    { question: 'Sieht der Kunde meine Kontaktdaten vor der Annahme?', answer: 'Nein. Vor der Annahme sieht der Kunde nur Ihre Stadt, Ihre Bewertungen und Ihre Offerte (Preis, Zeitrahmen, Nachricht). Erst nach Annahme werden die vollständigen Kontaktdaten beider Seiten ausgetauscht.' },
    { question: 'Kann ich mein Abo jederzeit wechseln?', answer: 'Ja, Sie können jederzeit upgraden. Bei einem Downgrade gilt die Änderung ab der nächsten Abrechnungsperiode.' },
    { question: 'Gibt es versteckte Kosten?', answer: 'Nein. Alle Preise sind transparent. Sie zahlen nur für das gewählte Abo, nicht pro Kontakt oder Offerte.' },
    { question: 'Wie funktioniert die Zahlung?', answer: 'Zahlungen erfolgen sicher per Kreditkarte. Ihr Abo wird automatisch verlängert, Sie können aber jederzeit kündigen.' }
  ];

  // Generate schema markup using helper
  const schemaMarkup = wrapInGraph(generateFAQSchema(pricingFaqItems));

  const plans = [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.monthly,
    SUBSCRIPTION_PLANS['6_month'],
    SUBSCRIPTION_PLANS.annual
  ];

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title={seoData.title}
        description={seoData.description}
        canonical={seoData.canonical}
        robotsMeta={seoData.robots}
        ogImage={seoData.og_image}
        schemaMarkup={schemaMarkup}
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-ink-900 mb-4">Preise für Handwerker</h1>
            <p className="text-xl text-ink-700">
              Wählen Sie Ihr Abo und senden Sie Offerten an interessante Projekte
            </p>
          </div>

          <Card className="mb-8 bg-pastel-blue-50 border-brand-600">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-ink-900 mb-4">So funktioniert das Offertensystem</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-brand-600 mb-2">1. Abo wählen</h4>
                  <p className="text-ink-700">
                    Free-Plan: 5 Offerten pro Monat. Monats-Abo (ab CHF 90): Unbegrenzte Offerten. 
                    Je länger das Abo, desto günstiger der Monatspreis.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-600 mb-2">2. Offerten einreichen</h4>
                  <p className="text-ink-700">
                    Sie sehen neue Anfragen mit PLZ, Stadt, Projektbeschreibung und Budget. 
                    Reichen Sie Ihre Offerte mit Preis, Zeitrahmen und persönlicher Nachricht ein. 
                    Sie haben 10 Tage Zeit für jede Anfrage.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-600 mb-2">3. Kontaktdaten nach Annahme</h4>
                  <p className="text-ink-700">
                    Sobald der Kunde Ihre Offerte akzeptiert, erhalten beide Seiten die vollständigen 
                    Kontaktdaten – ohne Zusatzkosten. Nur angenommene Offerten führen zum Kontakt.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.id === 'monthly' ? 'border-2 border-brand-600' : ''}>
                <CardHeader>
                  {plan.id === 'monthly' && (
                    <Badge className="w-fit mb-2">Beliebt</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-ink-900">
                      {plan.price === 0 ? 'Gratis' : `CHF ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">
                        {plan.billingCycle === 'monthly' && '/Monat'}
                        {plan.billingCycle === '6_month' && ' für 6 Monate'}
                        {plan.billingCycle === 'annual' && ' für 12 Monate'}
                      </span>
                    )}
                  </CardDescription>
                  {plan.id === '6_month' && (
                    <p className="text-sm text-brand-600 font-medium">Sparen Sie 10%</p>
                  )}
                  {plan.id === 'annual' && (
                    <p className="text-sm text-brand-600 font-medium">Sparen Sie 20%</p>
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
                  <Button 
                    onClick={() => handleSelectPlan(plan.id)}
                    variant={plan.id === 'monthly' ? 'default' : 'outline'}
                    className="w-full mt-4"
                  >
                    {plan.id === 'free' ? 'Kostenlos starten' : 'Jetzt abonnieren'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <section className="py-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4 text-center">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-ink-700 text-center mb-12">
              Alles, was Sie wissen müssen
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {pricingFaqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-ink-900 hover:text-brand-600 py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-700 leading-relaxed pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <div className="text-center py-8">
            <p className="text-ink-700">
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
