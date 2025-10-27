import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, Coins, LayoutDashboard, ShieldCheck, UserPlus, ClipboardCheck, Briefcase, ArrowRight } from 'lucide-react';

const HandwerkerLanding = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Target,
      title: 'Gezielt neue Kunden finden',
      description: 'Erhalten Sie Zugang zu Aufträgen, die genau zu Ihren Dienstleistungen passen. Kunden suchen aktiv nach Ihrem Fachwissen.'
    },
    {
      icon: Coins,
      title: 'Transparente Kosten',
      description: 'Zahlen Sie nur für die Leads, die Sie wirklich interessieren. Keine versteckten Gebühren, keine Überraschungen.'
    },
    {
      icon: LayoutDashboard,
      title: 'Alles im Überblick',
      description: 'Verwalten Sie Ihre Anfragen bequem in Ihrem Dashboard. Antworten Sie direkt auf Kundenanfragen und behalten Sie den Überblick.'
    },
    {
      icon: ShieldCheck,
      title: 'Seriöse Anfragen',
      description: 'Alle Anfragen werden von uns geprüft, bevor sie online gehen. So sparen Sie Zeit und können sich auf echte Projekte konzentrieren.'
    }
  ];

  const steps = [
    {
      icon: UserPlus,
      title: 'Registrieren',
      description: 'Erstellen Sie kostenlos Ihr Handwerker-Profil und wählen Sie Ihre Fachgebiete.'
    },
    {
      icon: ClipboardCheck,
      title: 'Profil-Freigabe',
      description: 'Nach kurzer Prüfung schalten wir Ihr Profil frei – Ihre Daten sind bei uns sicher.'
    },
    {
      icon: Briefcase,
      title: 'Aufträge erhalten',
      description: 'Durchsuchen Sie passende Aufträge und kontaktieren Sie interessierte Kunden direkt.'
    }
  ];

  const faqItems = [
    {
      question: 'Wie werde ich als Handwerker verifiziert?',
      answer: 'Nach Ihrer Registrierung prüfen wir Ihre Angaben manuell, um sicherzustellen, dass nur vertrauenswürdige und qualifizierte Fachbetriebe Zugang zu den Kundenanfragen erhalten. Diese Überprüfung dient dem Schutz unserer Auftraggeber und stärkt die Qualität auf der Plattform. In der Regel dauert sie 1–2 Werktage. Nach der Freischaltung erhalten Sie eine Bestätigungs-E-Mail und können direkt loslegen.'
    },
    {
      question: 'Wie funktioniert die Preisgestaltung für Handwerker?',
      answer: 'Die Registrierung ist kostenlos. Nach Ihrer Freischaltung können Sie erste Projektanfragen einsehen, inklusive Angaben zu Ort, Postleitzahl, Anliegen und Budget. Wenn Sie künftig mehr passende Leads erhalten und direkt mit Auftraggebern in Kontakt treten möchten, können Sie ein Abo abschliessen. Alle Details und Preise sind transparent im Login-Bereich sichtbar – erst nach der Freischaltung.'
    },
    {
      question: 'Welche Informationen sehen Auftraggeber von mir?',
      answer: 'Ihr Profil wird erst nach der Überprüfung für passende Anfragen freigeschaltet. Ihre Kontaktdaten bleiben geschützt, bis Sie selbst den Kontakt zu einem Auftraggeber aufnehmen. So behalten Sie jederzeit die Kontrolle über Ihre Sichtbarkeit und Anfragen.'
    },
    {
      question: 'Kann ich mein Profil später anpassen?',
      answer: 'Ja. In Ihrem Dashboard können Sie Ihre Angaben jederzeit aktualisieren – etwa Fachbereiche, Einsatzgebiete oder Stundensätze. So bleibt Ihr Profil immer auf dem neuesten Stand.'
    },
    {
      question: 'Muss ich auf jede Anfrage reagieren?',
      answer: 'Nein. Sie entscheiden selbst, welche Projekte für Sie interessant sind. Es gibt keine Verpflichtung, auf jede Anfrage zu antworten – Sie behalten volle Flexibilität.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-pastel-blue-50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 mb-6">
              Mehr Aufträge für Ihr Handwerksunternehmen
            </h1>
            <p className="text-xl md:text-2xl text-ink-700 mb-8">
              Erreichen Sie neue Kunden in Ihrer Region – einfach, transparent und fair.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                Jetzt kostenlos registrieren
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Anmelden
              </Button>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-ink-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <span>Über 100 aktive Aufträge pro Monat</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-600" />
                <span>Schnelle Vermittlung</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-brand-600" />
                <span>Keine versteckten Kosten</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Warum Büeze.ch?
            </h2>
            <p className="text-xl text-ink-700">
              Ihre Vorteile als Handwerker auf unserer Plattform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:border-brand-600 transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-brand-600/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-brand-600" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-pastel-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              So funktioniert's
            </h2>
            <p className="text-xl text-ink-700">
              In 3 einfachen Schritten zu neuen Aufträgen
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-ink-900 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-ink-700">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-ink-700">
              Alles, was Sie wissen müssen
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
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
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-pastel-blue-50 to-brand-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-6">
              Bereit, neue Aufträge zu erhalten?
            </h2>
            <p className="text-xl text-ink-700 mb-8">
              Registrieren Sie sich jetzt kostenlos und werden Sie Teil unserer Handwerker-Community.
            </p>
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 bg-white text-brand-600 hover:bg-white/90">
              Jetzt kostenlos registrieren
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HandwerkerLanding;
