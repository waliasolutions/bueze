import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, CheckCircle, Clipboard, Users, Shield, Clock, Award, MapPin } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';

const KategorienLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50 py-20 pt-32">
        <div className="container mx-auto px-4 max-w-6xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
            Alle Handwerk-Kategorien
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed max-w-3xl mx-auto">
            Wählen Sie die passende Kategorie für Ihr Projekt und erhalten Sie kostenlos mehrere Offerten von qualifizierten Handwerkern.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(majorCategories).map((category) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className="border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/kategorien/${category.slug}`)}
                >
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl text-ink-900">{category.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-ink-700 leading-relaxed text-sm">
                      {category.description}
                    </CardDescription>
                    <div className="text-sm text-brand-600 font-medium">
                      {category.subcategories.length} Dienstleistungen
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-brand-500 text-brand-600 hover:bg-brand-50 group-hover:bg-brand-50"
                    >
                      Mehr erfahren
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Section - SEO Optimized */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-6">
            Qualifizierte Handwerker in der Schweiz finden
          </h2>
          <div className="prose prose-lg max-w-none text-ink-700 space-y-4 mb-12">
            <p className="leading-relaxed">
              Ob Renovierung, Reparatur oder Neugestaltung – mit Büeze.ch finden Sie schnell und unkompliziert den passenden Handwerker für Ihr Projekt. Unsere Plattform verbindet Sie mit über 100 geprüften Handwerksbetrieben aus der ganzen Schweiz. Von Gartenarbeiten über Elektroinstallationen bis zu Malerarbeiten und Küchenmontage – alle Handwerk-Kategorien sind bei uns vertreten.
            </p>
            <p className="leading-relaxed">
              Der grosse Vorteil: Sie erstellen einmal eine Anfrage und erhalten mehrere Offerten von qualifizierten Fachbetrieben. So können Sie Preise, Leistungen und Verfügbarkeit direkt vergleichen – völlig kostenlos und unverbindlich. Alle registrierten Handwerker durchlaufen unseren Verifizierungsprozess, sodass Sie sich auf Qualität und Zuverlässigkeit verlassen können.
            </p>
            <p className="leading-relaxed">
              Egal ob Sie in Zürich, Basel, Bern, Luzern oder in einer anderen Region der Schweiz wohnen – über Büeze.ch erreichen Sie lokale Handwerker, die in Ihrer Nähe verfügbar sind. Kurze Anfahrtswege bedeuten schnellere Terminvereinbarung und oft günstigere Preise. Starten Sie jetzt Ihre kostenlose Anfrage und erhalten Sie innert 24 Stunden passende Offerten von erfahrenen Handwerkern.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Shield, text: 'Über 100 geprüfte Handwerksbetriebe' },
              { icon: CheckCircle, text: 'Kostenlos & unverbindlich für Auftraggeber' },
              { icon: Users, text: 'Mehrere Offerten zum Vergleichen' },
              { icon: Clock, text: 'Schnelle Rückmeldung innert 24h' },
              { icon: Award, text: 'Verifizierte Fachbetriebe' },
              { icon: MapPin, text: 'Schweizweite Abdeckung' },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-pastel-grey-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-ink-700 font-medium leading-relaxed">{benefit.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Details Section */}
      <section className="py-20 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-12 text-center">
            Unsere Handwerk-Kategorien im Detail
          </h2>
          
          <div className="space-y-12">
            {/* Garden */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <TreePine className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Gartenbau & Gartengestaltung</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Professionelle Gartenbauer verwandeln Ihren Aussenbereich in eine grüne Wohlfühloase. Ob Sie eine komplette Neugestaltung planen, regelmässige Gartenpflege benötigen oder eine Terrasse anlegen möchten – unsere Gartenbau-Experten haben die nötige Erfahrung. Typische Leistungen umfassen Rasenpflege, Baumpflanzung, Heckenschnitt, Terrassenbau und Weganlagen.
                </p>
                <p className="leading-relaxed">
                  Mit Büeze.ch finden Sie Gartenbauer in Ihrer Region, die Ihr Projekt termingerecht und zu fairen Preisen umsetzen. Von der ersten Beratung über die Planung bis zur Umsetzung begleiten Sie erfahrene Fachleute.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/garden')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Gartenarbeiten <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>

            {/* Flooring */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Parkett & Bodenbeläge</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Ein hochwertiger Fussboden wertet jedes Zuhause auf. Ob Sie Echtholzparkett, Laminat, Fliesen oder flexible Beläge wie PVC bevorzugen – professionelle Bodenleger sorgen für eine fachgerechte Verlegung. Die richtige Vorbereitung des Untergrunds und präzise Verlegetechnik sind entscheidend für ein langlebiges Ergebnis.
                </p>
                <p className="leading-relaxed">
                  Unsere registrierten Bodenleger beraten Sie zu Material, Verlegemuster und Pflege. Sie erhalten Offerten von erfahrenen Fachbetrieben, die auf Qualität und Präzision achten.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/flooring')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Bodenverlegung <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>

            {/* Electrical */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Elektroarbeiten & Installationen</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Elektroarbeiten gehören in professionelle Hände. Ob neue Steckdosen, moderne Beleuchtungskonzepte oder komplette Hausinstallationen – unsere zertifizierten Elektriker arbeiten nach Schweizer Normen und Sicherheitsstandards. Von der Planung über die Installation bis zur Abnahme begleiten Sie erfahrene Elektrofachkräfte.
                </p>
                <p className="leading-relaxed">
                  Notfall-Reparaturen, Erweiterungen oder Smart-Home-Integrationen – finden Sie den richtigen Elektriker für Ihr Projekt. Alle registrierten Elektriker verfügen über die notwendigen Zertifizierungen und Versicherungen.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/electrical')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Elektroarbeiten <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>

            {/* Painting */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <Paintbrush className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Malerarbeiten & Anstrich</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Frische Farbe schafft neues Ambiente. Professionelle Maler sorgen für saubere Ausführung bei Innen- und Aussenanstrichen. Ob Sie einzelne Räume streichen lassen, die Fassade erneuern oder spezielle Techniken wie Spachteln oder Tapezieren wünschen – unsere Malerbetriebe setzen Ihre Vorstellungen um.
                </p>
                <p className="leading-relaxed">
                  Mit der richtigen Vorbereitung, hochwertigen Farben und präziser Arbeitstechnik garantieren sie ein perfektes Ergebnis. Von der Farbberatung bis zum finalen Anstrich erhalten Sie professionelle Unterstützung.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/painting')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Malerarbeiten <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>

            {/* Moving */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <Truck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Transport & Umzugsarbeiten</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Ein Umzug bedeutet Stress – muss er aber nicht. Professionelle Umzugsfirmen übernehmen das Packen, den Transport und den Aufbau Ihrer Möbel. Ob Privatumzug, Firmenumzug, Möbeltransport oder Räumung – finden Sie das passende Umzugsunternehmen für Ihre Bedürfnisse.
                </p>
                <p className="leading-relaxed">
                  Versicherte Transporte, erfahrenes Personal und faire Preise sind bei unseren registrierten Partnern Standard. Erhalten Sie mehrere Offerten und vergleichen Sie Leistungen und Konditionen direkt.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/moving')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Umzugsdienstleistungen <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>

            {/* Kitchen */}
            <article className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                  <ChefHat className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-ink-900">Küchenbau & Montage</h3>
              </div>
              <div className="prose max-w-none text-ink-700 space-y-4">
                <p className="leading-relaxed">
                  Die Küche ist das Herzstück jeder Wohnung. Von der ersten Planung über die Auswahl der Materialien bis zur professionellen Montage – erfahrene Küchenbauer realisieren Ihre Traumküche. Ob Massanfertigung oder Einbauküche, moderne Designerküche oder klassische Landhausküche – unsere Küchenbau-Experten beraten Sie kompetent.
                </p>
                <p className="leading-relaxed">
                  Von der Vermessung über die 3D-Planung bis zur finalen Montage und Inbetriebnahme erhalten Sie alles aus einer Hand. Finden Sie den passenden Küchenbauer für Ihr Projekt.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/category/kitchen')}
                  className="mt-4 border-brand-500 text-brand-600 hover:bg-brand-50"
                >
                  Mehr zu Küchenbau <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4 text-center">
            So funktioniert die Handwerker-Vermittlung mit Büeze.ch
          </h2>
          <p className="text-xl text-ink-700 text-center mb-12 max-w-3xl mx-auto">
            In nur drei einfachen Schritten zum passenden Handwerker für Ihr Projekt
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg">
                <Clipboard className="w-10 h-10" />
              </div>
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-ink-900">Projekt beschreiben</h3>
              <p className="text-ink-700 leading-relaxed">
                Erstellen Sie kostenlos eine Anfrage und beschreiben Sie Ihr Handwerk-Projekt. Je detaillierter Ihre Angaben, desto passender die Offerten.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg">
                <Users className="w-10 h-10" />
              </div>
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-ink-900">Offerten erhalten</h3>
              <p className="text-ink-700 leading-relaxed">
                Qualifizierte Handwerker aus Ihrer Region melden sich bei Ihnen. Sie erhalten mehrere Offerten zum Vergleichen – innert 24 Stunden.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-ink-900">Handwerker wählen</h3>
              <p className="text-ink-700 leading-relaxed">
                Vergleichen Sie Preise, Bewertungen und Verfügbarkeit. Wählen Sie den Handwerker, der am besten passt – ohne Verpflichtung.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={() => navigate('/submit-lead')}
              className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-8"
            >
              Jetzt kostenlos Anfrage erstellen
            </Button>
            <p className="text-sm text-ink-600 mt-4">Kostenlos & unverbindlich</p>
          </div>
        </div>
      </section>

      {/* Regional Services Section */}
      <section className="py-20 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4 text-center">
            Handwerker-Dienste in allen Schweizer Kantonen
          </h2>
          <p className="text-xl text-ink-700 text-center mb-12 max-w-3xl mx-auto">
            Büeze.ch vermittelt Handwerker in der ganzen Schweiz. Egal ob Sie in einem städtischen Zentrum oder in einer ländlichen Region wohnen – über unsere Plattform erreichen Sie lokale Fachbetriebe in Ihrer Nähe.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { city: 'Zürich', description: 'Grösste Auswahl an Handwerkern für alle Kategorien' },
              { city: 'Basel', description: 'Starkes Netzwerk für Renovierung und Sanierung' },
              { city: 'Bern', description: 'Traditionelle Handwerksbetriebe mit Erfahrung' },
              { city: 'Luzern', description: 'Qualifizierte Handwerker für Stadt und Umgebung' },
              { city: 'Ostschweiz', description: 'St. Gallen, Thurgau, Appenzell' },
              { city: 'Zentralschweiz', description: 'Uri, Schwyz, Obwalden, Nidwalden' },
              { city: 'Aargau', description: 'Handwerker zwischen Stadt und Land' },
              { city: 'Westschweiz', description: 'Service auch auf Französisch' },
            ].map((region, index) => (
              <Card key={index} className="border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg text-ink-900">{region.city}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-ink-700 text-sm leading-relaxed">{region.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4 text-center">
            Häufig gestellte Fragen zur Handwerker-Vermittlung
          </h2>
          <p className="text-xl text-ink-700 text-center mb-12">
            Alles Wichtige zu Büeze.ch auf einen Blick
          </p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Ist die Nutzung von Büeze.ch wirklich kostenlos?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Ja, für Auftraggeber ist die Nutzung völlig kostenlos und unverbindlich. Sie erstellen Ihre Anfrage ohne Kosten und erhalten mehrere Offerten. Sie bezahlen nur den Handwerker für die ausgeführten Arbeiten – direkt mit ihm abgerechnet.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Wie schnell erhalte ich Offerten?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                In der Regel melden sich die ersten Handwerker innert 24 Stunden nach Ihrer Anfrage. Je nach Kategorie, Dringlichkeit und Region kann es manchmal schneller gehen. Bei dringenden Projekten empfehlen wir, dies in der Anfrage zu vermerken.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Sind die Handwerker geprüft?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Ja, alle registrierten Handwerker durchlaufen unseren Verifizierungsprozess. Wir prüfen Gewerbeberechtigung, Qualifikationen und in vielen Fällen auch Referenzen. Nur verifizierte Handwerker können auf der Plattform aktiv werden.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Muss ich alle Offerten annehmen?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Nein, Sie entscheiden völlig frei, mit welchem Handwerker Sie zusammenarbeiten möchten. Es gibt keine Verpflichtung, eine Offerte anzunehmen. Vergleichen Sie in Ruhe und wählen Sie den Anbieter, der am besten zu Ihrem Projekt passt.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Was passiert nach meiner Anfrage?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Nach dem Absenden Ihrer Anfrage wird diese an qualifizierte Handwerker in Ihrer Region weitergeleitet. Interessierte Handwerker kontaktieren Sie direkt über die Plattform. Sie können dann Details besprechen, Fragen klären und konkrete Offerten einholen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                Kann ich auch für dringende Projekte Handwerker finden?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Ja, geben Sie bei Ihrer Anfrage die Dringlichkeit an. Viele Handwerker auf unserer Plattform bieten auch Notfall-Services und Express-Termine an. Bei sehr dringenden Anfragen werden priorisiert Handwerker benachrichtigt, die kurzfristig verfügbar sind.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-border rounded-lg px-6 bg-pastel-grey-50">
              <AccordionTrigger className="text-left text-ink-900 font-semibold hover:text-brand-600">
                In welchen Regionen ist Büeze.ch aktiv?
              </AccordionTrigger>
              <AccordionContent className="text-ink-700 leading-relaxed">
                Wir sind schweizweit aktiv – von grossen Städten wie Zürich, Basel, Bern und Luzern bis zu ländlichen Gemeinden in allen Kantonen. Unser Netzwerk wächst ständig, sodass Sie überall qualifizierte Handwerker finden können.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-pastel-blue-50 to-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-6">
            Jetzt Ihren Handwerker-Auftrag erstellen
          </h2>
          <p className="text-xl text-ink-700 mb-8 leading-relaxed max-w-2xl mx-auto">
            Beschreiben Sie Ihr Projekt in wenigen Minuten und erhalten Sie kostenlos mehrere Offerten von qualifizierten Handwerkern aus Ihrer Region.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/submit-lead')}
            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Kostenlos Anfrage erstellen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-ink-600 mt-6">
            ✓ Kostenlos & unverbindlich  ✓ Über 100 geprüfte Handwerker  ✓ Innert 24h Rückmeldung
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KategorienLanding;
