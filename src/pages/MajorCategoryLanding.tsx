import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { categoryContent } from '@/config/categoryContent';
import { HowItWorks } from '@/components/HowItWorks';
import NotFound from './NotFound';

const MajorCategoryLanding = () => {
  const { majorCategorySlug } = useParams();
  const navigate = useNavigate();
  
  const majorCategory = Object.values(majorCategories).find(
    cat => cat.slug === majorCategorySlug
  );
  
  if (!majorCategory) {
    return <NotFound />;
  }
  
  const Icon = majorCategory.icon;
  const subcategories = majorCategory.subcategories
    .map(subId => subcategoryLabels[subId])
    .filter(Boolean);

  // Generate SEO meta tags based on category
  const getSEOData = () => {
    const baseUrl = 'https://bueeze.ch';
    switch (majorCategorySlug) {
      case 'bau-renovation':
        return {
          title: 'Bauarbeiter Schweiz | Bauhandwerker | Hausrenovation Schweiz | Büeze.ch',
          description: 'Bauarbeiter in der Schweiz finden. Professionelle Bauhandwerker für Hausrenovation in der Schweiz. Kostenlos Offerten vergleichen.',
          keywords: 'bauarbeiter in der schweiz, bauhandwerker schweiz, hausrenovation schweiz',
          intro: 'Sie planen eine Hausrenovation in der Schweiz? Finden Sie erfahrene Bauarbeiter und Bauhandwerker in Ihrer Region. Von der Planung bis zur Umsetzung begleiten Sie qualifizierte Fachleute durch Ihr Bauprojekt. Vergleichen Sie kostenlos mehrere Offerten von geprüften Baufachbetrieben.',
          schemaServiceType: 'Bau & Renovation'
        };
      case 'elektroinstallationen':
        return {
          title: 'Elektrik Service Schweiz | Elektroinstallationen | Elektriker Schweiz',
          description: 'Elektrik Service in der Schweiz. Professionelle Elektroinstallationen von geprüften Elektrikern. Kostenlos mehrere Offerten einholen.',
          keywords: 'elektrik service schweiz, elektroinstallationen',
          intro: 'Für sichere Elektroinstallationen braucht es Fachleute. Unser Elektrik Service verbindet Sie mit geprüften Elektrikern in der Schweiz – für Neubauten, Renovationen oder Notfälle. Alle Arbeiten erfolgen normgerecht und mit garantierter Sicherheit.',
          schemaServiceType: 'Elektroinstallationen'
        };
      case 'heizung-klima':
        return {
          title: 'Heizung & Sanitär Schweiz | Heizungsinstallationen | Büeze.ch',
          description: 'Heizung & Sanitär Service in der Schweiz. Professionelle Heizungsinstallationen von zertifizierten Fachbetrieben.',
          keywords: 'heizung & sanitär schweiz, heizungsinstallationen',
          intro: 'Eine zuverlässige Heizung ist das Herzstück jedes Zuhauses. Finden Sie zertifizierte Fachbetriebe für Heizungsinstallationen und Heizung & Sanitär Service in der Schweiz – kompetent, schnell und fair. Von der Wartung bis zum Komplettersatz.',
          schemaServiceType: 'Heizung, Klima & Solar'
        };
      case 'sanitaer':
        return {
          title: 'Sanitär Service Schweiz | Sanitärinstallationen | Sanitär Notdienst',
          description: 'Sanitär Service in der Schweiz. Zuverlässige Sanitärinstallationen und Notdienst. Mehrere Offerten kostenlos vergleichen.',
          keywords: 'sanitär service schweiz, sanitärinstallationen',
          intro: 'Vom tropfenden Wasserhahn bis zur kompletten Badsanierung: Unser Sanitär Service verbindet Sie mit erfahrenen Profis für Sanitärinstallationen in der ganzen Schweiz. Auch im Notfall sind wir für Sie da. Vergleichen Sie kostenlos mehrere Offerten.',
          schemaServiceType: 'Sanitär'
        };
      default:
        return {
          title: `${majorCategory.label} | Büeze.ch`,
          description: majorCategory.description,
          keywords: majorCategory.label.toLowerCase(),
          intro: majorCategory.description,
          schemaServiceType: majorCategory.label
        };
    }
  };

  const seoData = getSEOData();
  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": majorCategory.label,
    "description": seoData.intro,
    "provider": {
      "@type": "Organization",
      "name": "Büeze.ch",
      "url": "https://bueeze.ch"
    },
    "serviceType": seoData.schemaServiceType,
    "areaServed": {
      "@type": "Country",
      "name": "Schweiz"
    }
  });
  
  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title={seoData.title}
        description={seoData.description}
        canonical={`https://bueeze.ch/kategorie/${majorCategorySlug}`}
        schemaMarkup={schemaMarkup}
      />
      <Header />
      
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4 pt-24">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/kategorien">Kategorien</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{majorCategory.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50 py-20 pt-12">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${majorCategory.color} flex items-center justify-center text-white mb-4 shadow-lg mx-auto`}>
            <Icon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
            {majorCategory.label}
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed max-w-3xl mx-auto">
            {seoData.intro}
          </p>
          <div className="pt-6 space-y-3">
            <Button
              onClick={() => navigate('/submit-lead')}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Jetzt Auftrag erstellen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-ink-600">
              <strong className="text-brand-600">Kostenlos & unverbindlich</strong> – Offerten vergleichen
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none text-ink-700 space-y-6">
            {majorCategorySlug === 'bau-renovation' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Professionelle Bauarbeiter und Bauhandwerker in der Schweiz
                </h2>
                <p className="leading-relaxed">
                  Eine Hausrenovation in der Schweiz ist ein komplexes Projekt, das erfahrene Bauarbeiter und qualifizierte Bauhandwerker erfordert. Ob Sie einen Dachstock ausbauen, Ihr Badezimmer sanieren oder eine komplette Fassadenrenovation planen – die Wahl des richtigen Bauhandwerkers entscheidet über Qualität, Kosten und Zeitrahmen Ihres Projekts. Büeze.ch verbindet Sie mit geprüften Baufachbetrieben aus Ihrer Region, die über die notwendigen Qualifikationen, Versicherungen und langjährige Erfahrung verfügen.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Welche Baudienstleistungen werden angeboten?
                </h3>
                <p className="leading-relaxed">
                  Das Spektrum reicht von Parkett- und Laminatverlegung über Mauerarbeiten und Fassadensanierung bis zu kompletten Innenausbauten. Unsere Bauhandwerker in der Schweiz decken auch spezialisierte Bereiche ab: Trockenbau für flexible Raumgestaltung, Isolation für energieeffizientes Wohnen, Balkon- und Terrassenbau für Ihren Aussenbereich sowie Türen- und Fenstermontage. Jeder Bereich erfordert spezifisches Fachwissen – deshalb vermitteln wir Ihnen genau die Bauarbeiter, die zu Ihrem Projekt passen.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Warum professionelle Bauhandwerker beauftragen?
                </h3>
                <p className="leading-relaxed">
                  Bei einer Hausrenovation in der Schweiz geht es um mehr als handwerkliches Geschick. Bauarbeiter müssen lokale Bauvorschriften kennen, mit verschiedenen Materialien umgehen können und koordiniert mit anderen Gewerken zusammenarbeiten. Professionelle Baufachbetriebe bringen nicht nur das technische Know-how mit, sondern auch die nötige Haftpflichtversicherung und Garantieleistungen. Sie beraten Sie bei der Materialwahl, erstellen realistische Zeitpläne und sorgen für ein sauberes, fachgerechtes Ergebnis, das den Wert Ihrer Immobilie langfristig steigert.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Bauarbeiter in Ihrer Region finden
                </h3>
                <p className="leading-relaxed">
                  Von Zürich über Bern und Basel bis Luzern und St. Gallen – auf Büeze.ch finden Sie qualifizierte Bauhandwerker in allen Schweizer Regionen. Lokale Betriebe kennen die regionalen Besonderheiten, haben kurze Anfahrtswege und können schnell auf Ihre Anfrage reagieren. Durch unsere Plattform erhalten Sie mehrere Offerten zum Vergleich und können in Ruhe entscheiden, welcher Bauarbeiter am besten zu Ihrem Projekt und Budget passt. Transparenz, Qualität und faire Preise stehen dabei im Mittelpunkt.
                </p>
              </>
            )}

            {majorCategorySlug === 'elektroinstallationen' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Professioneller Elektrik Service und Elektroinstallationen in der Schweiz
                </h2>
                <p className="leading-relaxed">
                  Elektrik Service in der Schweiz erfordert höchste Sicherheitsstandards und Fachkompetenz. Vom einfachen Lampenwechsel bis zur kompletten Elektroinstallation im Neubau – nur geprüfte Elektriker dürfen diese Arbeiten ausführen. Bei Büeze.ch finden Sie ausschliesslich zertifizierte Elektrofachbetriebe mit gültiger Installationsbewilligung. Diese Elektriker in der Schweiz arbeiten nach den aktuellen NIV-Normen, kennen die lokalen Vorschriften und garantieren sichere, langlebige Installationen.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Welche Elektroinstallationen bieten wir an?
                </h3>
                <p className="leading-relaxed">
                  Unsere Elektriker decken das komplette Spektrum ab: Hausinstallationen für Neu- und Umbauten, Installation und Erneuerung von Sicherungskästen und Unterverteilungen, Starkstromanschlüsse für Elektrogeräte, moderne Beleuchtungssysteme mit LED-Technologie und Smart Home-Lösungen. Auch Spezialgebiete wie Photovoltaik-Anlagen, E-Ladestationen, Netzwerk- und Datenverkabelung sowie Elektrokontrollen gehören zum Leistungsumfang. Für Notfälle steht Ihnen ein 24/7 Elektrik Service zur Verfügung, der bei Stromausfällen und Kurzschlüssen schnell reagiert.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Warum professionelle Elektriker beauftragen?
                </h3>
                <p className="leading-relaxed">
                  Elektroinstallationen gehören zu den gefährlichsten Arbeiten am Bau. Fehler können zu Bränden, Stromschlägen oder Gerätedefekten führen. Deshalb ist in der Schweiz eine Installationsbewilligung Pflicht. Unsere Elektriker bringen nicht nur die rechtlich vorgeschriebene Qualifikation mit, sondern auch langjährige Erfahrung, umfassende Versicherung und Garantieleistungen. Sie kennen die aktuellen Sicherheitsnormen, verwenden geprüftes Material und dokumentieren alle Arbeiten für die obligatorische Sicherheitsprüfung. Das gibt Ihnen die Gewissheit, dass Ihre Elektroinstallation sicher und normgerecht ist.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Elektrik Service in Ihrer Region
                </h3>
                <p className="leading-relaxed">
                  Ob in Zürich, Bern, Luzern, Basel oder Genf – qualifizierte Elektriker für Ihre Region finden Sie auf Büeze.ch. Lokale Elektrofachbetriebe haben kurze Anfahrtswege, kennen regionale Besonderheiten und bieten oft auch Notdienste an. Vergleichen Sie kostenlos mehrere Offerten von geprüften Elektrikern in Ihrer Nähe und profitieren Sie von transparenten Preisen, zuverlässiger Arbeit und kompetenter Beratung. Ihre Sicherheit steht an erster Stelle.
                </p>
              </>
            )}

            {majorCategorySlug === 'heizung-klima' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Professionelle Heizung & Sanitär Service und Heizungsinstallationen in der Schweiz
                </h2>
                <p className="leading-relaxed">
                  Eine funktionierende Heizung ist das Herzstück jedes Schweizer Zuhauses – besonders in den kalten Wintermonaten. Ob Ölheizung, Gasheizung, Wärmepumpe oder moderne Pelletheizung: Professionelle Heizungsinstallationen erfordern Fachwissen, Erfahrung und die richtigen Werkzeuge. Bei Büeze.ch finden Sie zertifizierte Fachbetriebe für Heizung & Sanitär Service, die nicht nur installieren, sondern auch warten, reparieren und energieeffizient modernisieren. Investieren Sie in die richtige Heizungslösung und senken Sie langfristig Ihre Energiekosten.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Welche Heizungsinstallationen bieten wir an?
                </h3>
                <p className="leading-relaxed">
                  Unsere Heizungsfachleute decken alle Systeme ab: Installation und Wartung von Ölheizungen, Gasheizungen, Wärmepumpen (Luft, Sole, Wasser), Pellet- und Holzheizungen sowie Fernwärmeanschlüssen. Auch moderne Solarthermie-Anlagen, Fussbodenheizungen und Heizkörper gehören zum Leistungsspektrum. Neben Neuinstallationen bieten wir Heizungssanierung, regelmässige Wartung, Notdienste bei Heizungsausfällen und Energieberatung an. Klimaanlagen und Lüftungssysteme runden das Angebot ab – für ein angenehmes Raumklima das ganze Jahr über.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Warum professionellen Heizung & Sanitär Service wählen?
                </h3>
                <p className="leading-relaxed">
                  Heizungsinstallationen sind komplex und unterliegen strengen Vorschriften. Fehler bei der Installation können zu hohen Energiekosten, Ausfällen im Winter oder sogar Sicherheitsrisiken führen. Zertifizierte Heizungsfachbetriebe kennen die aktuellen Energievorschriften, beraten Sie zu Förderprogrammen und garantieren eine fachgerechte Ausführung. Regelmässige Wartung durch Profis verlängert die Lebensdauer Ihrer Heizung, optimiert die Effizienz und verhindert teure Reparaturen. Mit einem erfahrenen Partner sind Sie auch im Notfall nicht allein.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Heizungsinstallationen in Ihrer Region
                </h3>
                <p className="leading-relaxed">
                  Von Zürich bis Genf, von Basel bis Lugano – qualifizierte Heizungsfachbetriebe gibt es in jeder Schweizer Region. Lokale Betriebe kennen die klimatischen Bedingungen vor Ort, haben kurze Anfahrtswege und können bei Notfällen schnell reagieren. Über Büeze.ch erhalten Sie mehrere Offerten von geprüften Fachbetrieben für Heizung & Sanitär Service. Vergleichen Sie Preise, Leistungen und Referenzen – und entscheiden Sie sich für den Partner, der am besten zu Ihren Bedürfnissen passt.
                </p>
              </>
            )}

            {majorCategorySlug === 'sanitaer' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Professioneller Sanitär Service und Sanitärinstallationen in der Schweiz
                </h2>
                <p className="leading-relaxed">
                  Vom tropfenden Wasserhahn bis zur kompletten Badsanierung: Sanitär Service in der Schweiz umfasst ein breites Spektrum an Dienstleistungen. Qualifizierte Sanitärinstallateure sorgen für funktionierende Wasserleitungen, moderne Badezimmer und zuverlässige Abwassersysteme. Bei Büeze.ch finden Sie geprüfte Sanitärfachbetriebe, die nicht nur reparieren und installieren, sondern auch bei Notfällen wie Rohrbrüchen oder verstopften Abflüssen schnell zur Stelle sind. Vertrauen Sie auf Fachleute, die Ihr Sanitärsystem in einwandfreiem Zustand halten.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Welche Sanitärinstallationen bieten wir an?
                </h3>
                <p className="leading-relaxed">
                  Unsere Sanitärfachbetriebe decken alle Bereiche ab: Badezimmerrenovation und -sanierung, Installation von Badewannen, Duschen, WCs und Waschbecken, Kücheninstallationen mit modernen Armaturen, Wasseraufbereitungsanlagen, Boiler-Service und -austausch, sowie Reparaturen an Wasserleitungen und Abflüssen. Auch Spezialgebiete wie Regenwassernutzung, Gartenbewässerung und barrierefreie Bäder gehören zum Leistungsumfang. Im Notfall steht ein 24/7 Sanitär Notdienst bereit, der bei Wasserschäden und Rohrbrüchen sofort eingreift.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Warum professionellen Sanitär Service beauftragen?
                </h3>
                <p className="leading-relaxed">
                  Sanitärarbeiten erfordern präzises Arbeiten und fundiertes Wissen über Wasserdruck, Leitungssysteme und Hygiene-Vorschriften. Fehlerhafte Installationen können zu Wasserschäden, Schimmelbildung oder hohen Wasserkosten führen. Unsere Sanitärinstallateure bringen die notwendige Ausbildung, Erfahrung und Versicherung mit. Sie arbeiten sauber, verwenden hochwertige Materialien und garantieren für ihre Arbeit. Bei Notfällen können Sie auf schnelle Hilfe zählen – denn Wasserschäden dulden keinen Aufschub.
                </p>
                
                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Sanitär Service in Ihrer Region
                </h3>
                <p className="leading-relaxed">
                  Egal ob Sie in Zürich, Bern, Luzern, Basel oder einer anderen Schweizer Stadt wohnen – über Büeze.ch finden Sie schnell qualifizierte Sanitärfachbetriebe in Ihrer Nähe. Lokale Betriebe reagieren bei Notfällen schneller, kennen regionale Besonderheiten und bieten oft auch Wartungsverträge an. Vergleichen Sie kostenlos mehrere Offerten für Sanitärinstallationen und wählen Sie den Fachbetrieb, der Ihren Anforderungen am besten entspricht. Transparente Preise, zuverlässiger Service und kompetente Beratung – das erwartet Sie bei unseren Partner-Betrieben.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Subcategories as Rich Content Sections */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-ink-900">
            Unsere Dienstleistungen in {majorCategory.label}
          </h2>
          <p className="text-center text-ink-700 mb-12 max-w-2xl mx-auto">
            Finden Sie den passenden Handwerker für Ihr Projekt – kostenlos und unverbindlich
          </p>
          
          <div className="space-y-16">
            {subcategories.map((subcat, index) => {
              const content = categoryContent[subcat.slug];
              const SubIcon = Icon;
              
              return (
                <div 
                  key={subcat.value} 
                  id={subcat.value}
                  className="scroll-mt-24"
                >
                  <Card className="border-2 border-border overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-pastel-blue-50 to-surface pb-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${majorCategory.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                          <SubIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-ink-900 mb-2">{subcat.label}</CardTitle>
                          <CardDescription className="text-base text-ink-700">
                            {subcat.shortDescription || content?.description || ''}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {content && content.services && content.services.length > 0 && (
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {content.services.slice(0, 3).map((service, idx) => {
                            const ServiceIcon = service.icon;
                            return (
                              <div key={idx} className="p-4 rounded-lg bg-pastel-grey-50 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <ServiceIcon className="w-5 h-5 text-brand-600" />
                                  <h4 className="font-semibold text-ink-900">{service.title}</h4>
                                </div>
                                <p className="text-sm text-ink-700">{service.description}</p>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex justify-center">
                          <Button
                            onClick={() => navigate(`/submit-lead?category=${content.formCategory}`)}
                            className="h-12 px-8"
                          >
                            Offerte einholen für {subcat.label}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                    
                    {(!content || !content.services || content.services.length === 0) && (
                      <CardContent className="pt-6">
                        <div className="flex justify-center">
                          <Button
                            onClick={() => navigate(`/submit-lead`)}
                            className="h-12 px-8"
                          >
                            Offerte einholen für {subcat.label}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Benefits Section */}
      <section className="py-16 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-ink-900">
            Ihre Vorteile mit Büeze.ch
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {majorCategory.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-ink-700 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-ink-900">
            Häufig gestellte Fragen
          </h2>
          <p className="text-center text-ink-700 mb-12">
            Antworten zu {majorCategory.label}
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {majorCategory.faq.map((faqItem, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-ink-900">
                  {faqItem.question}
                </AccordionTrigger>
                <AccordionContent className="text-ink-700">
                  {faqItem.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit für Ihr Projekt?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Erstellen Sie jetzt Ihre Anfrage und erhalten Sie kostenlose Offerten
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate('/submit-lead')}
            className="h-14 px-10 text-lg"
          >
            Jetzt Auftrag erstellen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
      
      {/* SEO Content Section - Positioned at bottom */}
      <section className="py-16 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none text-ink-700 space-y-6">
            {majorCategorySlug === 'elektroinstallationen' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Elektroinstallationen: Sicherheit und Technologie
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Elektrische Installationen gehören zu den anspruchsvollsten Arbeiten im Gebäudebereich. Die Schweizer Norm NIV (Niederspannungs-Installationsverordnung) definiert präzise Anforderungen an Planung, Ausführung und Prüfung elektrischer Anlagen. Nur ausgebildete Elektroinstallateure mit eidgenössischem Fachausweis dürfen selbstständig an Hausinstallationen arbeiten – eine Regelung, die der Sicherheit dient.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Von der Grundinstallation bis zur Smart-Home-Integration
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Moderne Elektroinstallationen umfassen deutlich mehr als Licht und Steckdosen. Netzwerkkabel für Internet und Telefonie, Ladestationen für Elektrofahrzeuge, Photovoltaik-Anlagen mit Speichersystemen und vernetzte Haustechnik erfordern vorausschauende Planung. Ein zukunftsfähiges Installationskonzept berücksichtigt bereits bei der Planung mögliche Erweiterungen und technologische Entwicklungen.
                </p>

                <p className="text-lg leading-relaxed">
                  Die Elektrifizierung von Heizungen (Wärmepumpen) und die zunehmende Verbreitung von Heimladestationen für Elektroautos stellen neue Anforderungen an Hausinstallationen. Viele ältere Gebäude benötigen eine Verstärkung des Hausanschlusses, um die zusätzliche Leistung bereitzustellen. Fachbetriebe analysieren die bestehende Installation und entwickeln Lösungen, die sowohl aktuelle als auch zukünftige Anforderungen erfüllen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Sicherheit und Wartung
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Elektrische Anlagen unterliegen in der Schweiz regelmäßigen Kontrollen. Eidgenössische Starkstrominspektorate (ESTI) überwachen die Einhaltung der Sicherheitsvorschriften. Bei Neubauten, größeren Umbauten und in bestimmten Zeitabständen sind Sicherheitsnachweise durch unabhängige Kontrollen erforderlich. Qualifizierte Elektrofachbetriebe kennen diese Anforderungen und stellen sicher, dass alle Installationen den geltenden Normen entsprechen.
                </p>

                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>FI-Schutzschalter (RCD) sind Pflicht und schützen vor lebensgefährlichen Stromschlägen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Überspannungsschutz verhindert Schäden an empfindlicher Elektronik durch Blitzschlag</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Selektive Absicherung ermöglicht gezielte Fehlersuche und minimiert Ausfallzeiten</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Dokumentation aller Installationen ist gesetzlich vorgeschrieben und für Wartung essenziell</span>
                  </li>
                </ul>

                <p className="text-lg leading-relaxed">
                  Bei der Auswahl eines Elektrofachbetriebs sollten Sie auf Mitgliedschaft im Verband Electrosuisse oder EIT.swiss achten. Diese Verbände setzen hohe Qualitätsstandards und bieten kontinuierliche Weiterbildung. Eine gültige Betriebshaftpflichtversicherung ist ebenfalls ein wichtiges Qualitätsmerkmal – sie schützt Sie im unwahrscheinlichen Fall von Installationsfehlern.
                </p>
              </>
            )}
            {majorCategorySlug === 'heizung-klima' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Heizung und Klima: Energieeffizienz und Komfort
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Die Heizungstechnik durchläuft derzeit einen fundamentalen Wandel. Fossile Brennstoffe werden zunehmend durch erneuerbare Energien ersetzt, während gleichzeitig die Anforderungen an Effizienz und Komfort steigen. Die Schweizer Energiestrategie 2050 und kantonale Energiegesetze beschleunigen diese Entwicklung durch Förderprogramme und teilweise durch Vorgaben beim Heizungsersatz.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Systemvielfalt und Auswahlkriterien
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Wärmepumpen dominieren bei Neubauten und Heizungssanierungen. Sie nutzen Umweltwärme aus Luft, Erdreich oder Grundwasser und wandeln diese mit elektrischer Energie in Heizwärme um. Die Jahresarbeitszahl (JAZ) gibt an, wie effizient eine Wärmepumpe arbeitet – Werte über 3,5 gelten als gut. Die tatsächliche Effizienz hängt stark von der Gebäudeisolation und der Vorlauftemperatur ab: Fußbodenheizungen mit niedrigen Vorlauftemperaturen arbeiten deutlich effizienter als Radiatoren mit hohen Temperaturen.
                </p>

                <p className="text-lg leading-relaxed">
                  Holzheizungen (Pellets, Schnitzel, Stückholz) bieten eine Alternative mit erneuerbarer Energie. Sie erfordern jedoch Lagerraum, regelmäßige Wartung und produzieren Emissionen, die je nach Standort bewilligungspflichtig sein können. Moderne Pelletheizungen sind weitgehend automatisiert und erreichen hohe Wirkungsgrade, benötigen aber mehr Platz und Aufmerksamkeit als Wärmepumpen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Klimatisierung und Lüftung
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Klimaanlagen werden auch in der Schweiz wichtiger, da Hitzesommer häufiger werden. Reversible Wärmepumpen können sowohl heizen als auch kühlen – eine platzsparende Lösung für ganzjährigen Komfort. Split-Geräte sind einfach nachzurüsten, während zentrale Lüftungsanlagen mit Wärmerückgewinnung bei Neubauten Standard werden. Solche Anlagen versorgen alle Räume mit frischer Luft, filtern Pollen und sparen Energie durch Wärmerückgewinnung aus der Abluft.
                </p>

                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Gebäudehülle bestimmt Heizleistung: Isolation vor Heizung erneuern spart Kosten</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Hydraulischer Abgleich optimiert Wärmeverteilung und senkt Energieverbrauch um 10-15%</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Förderprogramme: Viele Kantone unterstützen Umstieg auf erneuerbare Energien finanziell</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Wartungsverträge sichern Effizienz und verlängern Lebensdauer der Anlage</span>
                  </li>
                </ul>
              </>
            )}
            {majorCategorySlug === 'sanitaer' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Sanitärtechnik: Planung, Installation und Wartung
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Sanitärinstallationen verbinden technische Präzision mit Gestaltungswünschen. Die SIA-Normen 385/1 (Trinkwasserinstallationen) und 385/2 (Abwasseranlagen) definieren in der Schweiz technische Mindestanforderungen. Gleichzeitig spielen ästhetische Aspekte eine wichtige Rolle, da Badezimmer und Küchen zu den am intensivsten genutzten Räumen gehören.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Wassertechnologie und Hygiene
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Trinkwasserhygiene hat in den letzten Jahren an Bedeutung gewonnen. Legionellen – Bakterien, die sich in warmem Wasser vermehren – können gesundheitliche Risiken bergen. Moderne Warmwasserkonzepte vermeiden Stagnation durch Zirkulationssysteme oder dezentrale Durchlauferhitzer. Die Temperaturhaltung im gesamten System ist entscheidend: Warmwasser sollte mindestens 60°C erreichen, während Kaltwasser unter 25°C bleiben muss.
                </p>

                <p className="text-lg leading-relaxed">
                  Wasserenthärtung kann in Gebieten mit hartem Wasser sinnvoll sein. Kalkablagerungen verkürzen die Lebensdauer von Armaturen, Boilern und Haushaltsgeräten. Moderne Enthärtungsanlagen arbeiten sparsam und regenerieren sich automatisch. Die Investition amortisiert sich durch geringeren Energieverbrauch und längere Lebensdauer der Anlagen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Badsanierung und Barrierefreiheit
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Badezimmersanierungen erfordern koordinierte Planung zwischen Sanitär, Elektro, Plattenlegern und oft auch Zimmerleuten. Die Abfolge der Arbeiten ist entscheidend: Erst Rohinstallation, dann Abdichtung und Fliesen, zuletzt die Montage der Apparate. Erfahrene Sanitärfachbetriebe koordinieren diese Gewerke und stellen sicher, dass alle Schnittstellen funktionieren.
                </p>

                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Bodengleiche Duschen sind nicht überall umsetzbar – Geschossdecke bestimmt Machbarkeit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Vorwandinstallationen ermöglichen flexible Raumgestaltung und einfache Wartung</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Wassersparende Armaturen reduzieren Verbrauch ohne Komfortverlust</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Abdichtung ist kritisch: Fehler zeigen sich oft erst nach Jahren</span>
                  </li>
                </ul>
              </>
            )}
            {majorCategorySlug === 'bau-renovation' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Bau und Renovation: Von der Planung bis zur Vollendung
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Bauprojekte in der Schweiz unterliegen strengen Vorschriften. Baubewilligungen, Lärmschutzauflagen, Arbeitssicherheit und Entsorgungsvorschriften müssen beachtet werden. Professionelle Baufachbetriebe kennen die kantonalen und kommunalen Besonderheiten und stellen sicher, dass Ihr Projekt rechtskonform umgesetzt wird.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Renovationsprojekte richtig planen
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Erfolgreiche Renovationen beginnen mit einer gründlichen Bestandsaufnahme. Bausubstanz, Statik, Schadstoffe und versteckte Installationen können Überraschungen bergen. Erfahrene Bauunternehmer erkennen potenzielle Probleme frühzeitig und kalkulieren entsprechende Reserven ein. Eine realistische Planung verhindert Budgetüberschreitungen und zeitliche Verzögerungen.
                </p>

                <p className="text-lg leading-relaxed">
                  Energetische Sanierungen gewinnen an Bedeutung. Die Kombination von Fassadendämmung, Fensterersatz und Heizungserneuerung bringt die größten Einsparungen. Das Gebäudeprogramm von Bund und Kantonen fördert solche Maßnahmen mit attraktiven Beiträgen. Ein Fachbetrieb mit Erfahrung in energetischen Sanierungen kann Fördermöglichkeiten aufzeigen und die Antragsstellung unterstützen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Koordination und Bauablauf
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Größere Renovationen erfordern die Koordination mehrerer Gewerke. Ein Baumeister oder Generalunternehmer übernimmt diese Rolle und stellt sicher, dass alle Arbeiten in der richtigen Reihenfolge und Qualität ausgeführt werden. Dies entlastet Sie als Bauherr erheblich und schafft klare Verantwortlichkeiten.
                </p>

                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Detaillierte Offerten mit Leistungsverzeichnis vermeiden spätere Diskussionen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Festpreisvereinbarungen bieten Kostensicherheit, verlangen aber präzise Planung</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Regelmäßige Bausitzungen halten alle Beteiligten auf dem Laufenden</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand-600 mr-3">•</span>
                    <span>Bauabnahme mit Mängelliste schützt Ihre Interessen</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MajorCategoryLanding;
