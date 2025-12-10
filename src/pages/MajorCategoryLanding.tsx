import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { usePageContent } from '@/hooks/usePageContent';
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

  // Fetch SEO data from database
  const { content } = usePageContent(`major-${majorCategorySlug}`);
  
  // Fallback SEO data if database fetch fails
  const getFallbackSEOData = () => {
    switch (majorCategorySlug) {
      case 'bau-renovation':
        return {
          title: 'Bau & Renovation – Handwerker finden | Büeze.ch',
          description: 'Bauarbeiten und Renovierungen in der Schweiz. Professionelle Handwerker für Umbau, Sanierung und Neubauten. Jetzt Offerten vergleichen.',
          intro: 'Sie planen eine Hausrenovation oder einen Neubau? Finden Sie erfahrene Bauarbeiter und qualifizierte Handwerker in Ihrer Region. Von der Planung bis zur Umsetzung begleiten Sie Fachleute durch Ihr Bauprojekt. Vergleichen Sie kostenlos mehrere Offerten.'
        };
      case 'elektroinstallationen':
        return {
          title: 'Elektriker finden in der Schweiz | Büeze.ch',
          description: 'Elektroinstallationen von geprüften Elektrikern. Hausinstallationen, Smart Home, E-Mobilität und mehr. Kostenlos Offerten einholen.',
          intro: 'Für sichere Elektroinstallationen braucht es Fachleute. Unser Elektrik Service verbindet Sie mit geprüften Elektrikern in der Schweiz – für Neubauten, Renovationen oder Notfälle. Alle Arbeiten erfolgen normgerecht und mit garantierter Sicherheit.'
        };
      case 'heizung-klima':
        return {
          title: 'Heizung & Klima Installateure finden | Büeze.ch',
          description: 'Heizung, Klima und Lüftung von Fachbetrieben. Wärmepumpen, Klimaanlagen, Solar – passende Offerten erhalten.',
          intro: 'Eine zuverlässige Heizung ist das Herzstück jedes Zuhauses. Finden Sie zertifizierte Fachbetriebe für Heizungsinstallationen und Heizung & Sanitär Service in der Schweiz – kompetent, schnell und fair. Von der Wartung bis zum Komplettersatz.'
        };
      case 'sanitaer':
        return {
          title: 'Sanitär-Fachbetriebe in der Schweiz | Büeze.ch',
          description: 'Sanitärinstallationen von qualifizierten Fachbetrieben. Bad, Küche, Leitungen – vergleichen Sie Offerten.',
          intro: 'Vom tropfenden Wasserhahn bis zur kompletten Badsanierung: Unser Sanitär Service verbindet Sie mit erfahrenen Profis für Sanitärinstallationen in der ganzen Schweiz. Auch im Notfall sind wir für Sie da. Vergleichen Sie kostenlos mehrere Offerten.'
        };
      case 'bodenbelaege':
        return {
          title: 'Bodenleger finden in der Schweiz | Büeze.ch',
          description: 'Bodenbeläge vom Profi verlegen lassen. Parkett, Laminat, Fliesen und mehr. Jetzt Offerten vergleichen.',
          intro: 'Der richtige Bodenbelag macht den Unterschied. Finden Sie professionelle Bodenleger in der Schweiz für Parkett, Laminat, Vinyl und mehr. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben.'
        };
      case 'innenausbau-schreiner':
        return {
          title: 'Schreiner & Innenausbau in der Schweiz | Büeze.ch',
          description: 'Innenausbau und Schreinerarbeiten in der Schweiz. Möbelbau, Türen, Fenster – kostenlos Offerten einholen.',
          intro: 'Qualität im Detail – das zeichnet gute Schreinerarbeiten aus. Ob Möbelbau, Fenster oder Türen: Finden Sie erfahrene Schreiner für Innenausbau in der Schweiz. Vergleichen Sie kostenlos Offerten von Fachbetrieben.'
        };
      case 'kueche':
        return {
          title: 'Küchenbauer finden in der Schweiz | Büeze.ch',
          description: 'Küchenbau und Küchenrenovation in der Schweiz. Planung, Montage und Geräte-Installation. Jetzt Offerten vergleichen.',
          intro: 'Eine neue Küche ist eine langfristige Investition in Lebensqualität. Finden Sie erfahrene Küchenbauer in der Schweiz für Planung, Montage und Renovation. Von der ersten Idee bis zur fertigen Traumküche – vergleichen Sie kostenlos Offerten von Fachbetrieben.'
        };
      case 'garten-aussenbereich':
        return {
          title: 'Gartenbau & Aussenbereich | Büeze.ch',
          description: 'Garten und Aussenbereich gestalten. Gartenbau, Pflasterarbeiten, Zäune – passende Handwerker finden.',
          intro: 'Ein gepflegter Garten ist Lebensqualität. Finden Sie professionelle Gartenbauer in der Schweiz für Landschaftsbau, Gartengestaltung und mehr. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben.'
        };
      case 'raeumung-entsorgung':
        return {
          title: 'Räumung & Entsorgung in der Schweiz | Büeze.ch',
          description: 'Räumung und Entsorgung professionell erledigen. Haushaltsauflösung, Entrümpelung – Offerten vergleichen.',
          intro: 'Professionelle Räumung und fachgerechte Entsorgung. Finden Sie zuverlässige Entrümpelungsdienste in der Schweiz für Wohnungen, Häuser und Betriebe. Vergleichen Sie kostenlos Offerten.'
        };
      case 'sonstige-handwerkerleistungen':
        return {
          title: 'Weitere Handwerkerleistungen | Büeze.ch',
          description: 'Weitere Handwerkerleistungen in der Schweiz. Individuelle Anfragen für spezielle Projekte.',
          intro: 'Ihr Projekt passt in keine Standardkategorie? Finden Sie Handwerker in der Schweiz für vielfältige Leistungen. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben.'
        };
      default:
        return {
          title: `${majorCategory.label} | Büeze.ch`,
          description: majorCategory.description,
          intro: majorCategory.description
        };
    }
  };

  const seoData = content?.seo || getFallbackSEOData();
  const introText = content?.fields?.intro || seoData.intro;
  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": majorCategory.label,
    "description": introText,
    "provider": {
      "@type": "Organization",
      "name": "Büeze.ch",
      "url": "https://bueeze.ch"
    },
    "serviceType": majorCategory.label,
    "areaServed": {
      "@type": "Country",
      "name": "Schweiz"
    }
  });
  
  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title={seoData.title || `${majorCategory.label} | Büeze.ch`}
        description={seoData.description || majorCategory.description}
        canonical={seoData.canonical || `https://bueeze.ch/kategorien/${majorCategorySlug}`}
        robotsMeta={seoData.robots}
        ogImage={seoData.og_image}
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
            {introText}
          </p>
          <div className="pt-6">
            <Button
              onClick={() => navigate(`/submit-lead?category=${majorCategory.id}`)}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Jetzt Auftrag erstellen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Subcategories as Clean List */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-4 text-ink-900">
          Finden Sie Handwerker für diese {majorCategory.label}-Dienstleistungen
        </h2>
          <p className="text-center text-ink-700 mb-16 max-w-2xl mx-auto">
            Finden Sie den passenden Handwerker für Ihr Projekt – kostenlos und unverbindlich
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {subcategories.map((subcat) => {
              const SubIcon = Icon;
              
              return (
                <div
                  key={subcat.value} 
                  id={subcat.value}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white scroll-mt-24"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${majorCategory.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <SubIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 text-base">
                      {subcat.label}
                    </h3>
                    <p className="text-sm text-ink-600 mt-0.5 line-clamp-1">
                      {subcat.shortDescription || 'Professionelle Dienstleistung'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
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
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-50 to-pastel-blue-100">
        <div className="container mx-auto px-4 text-center space-y-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900">
            Vergleichen Sie Offerten und sparen Sie Zeit
          </h2>
          <p className="text-xl text-ink-700">
            Beschreiben Sie Ihr Projekt in 3 Minuten. Erhalten Sie bis zu 5 passende Offerten von geprüften Fachbetrieben aus Ihrer Region.
          </p>
          <div className="pt-4">
            <Button
              onClick={() => navigate(`/submit-lead?category=${majorCategory.id}`)}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Kostenlose Anfrage erstellen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* SEO Content Section - Positioned at bottom */}
      <section className="py-16 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none text-ink-700 space-y-6">
            {majorCategorySlug === 'elektroinstallationen' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Elektroinstallationen: Was Sie wissen sollten
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Elektroarbeiten gehören zu den wenigen Handwerksarbeiten, die gesetzlich reguliert sind – und das aus gutem Grund. Ein Fehler kann im schlimmsten Fall lebensgefährlich sein. Deshalb dürfen nur ausgebildete Elektroinstallateure mit Fachausweis an Ihrer Hausinstallation arbeiten.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Von der Grundinstallation bis zur E-Ladestation
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Moderne Häuser brauchen mehr als nur Licht und Steckdosen. Wärmepumpen, Ladestationen für Elektroautos, Photovoltaik-Anlagen – all das stellt höhere Anforderungen an Ihre Elektroinstallation. Viele ältere Häuser kommen mit der zusätzlichen Last nicht zurecht und brauchen eine Verstärkung des Hausanschlusses.
                </p>

                <p className="text-lg leading-relaxed">
                  Ein guter Elektriker analysiert zuerst Ihre bestehende Installation und plant dann mit Ihnen, wie Sie Ihre Wünsche umsetzen können – und zwar so, dass auch spätere Erweiterungen möglich bleiben.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Worauf Sie achten sollten
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Lassen Sie sich die Installationsbewilligung zeigen</li>
                  <li>Fragen Sie nach der Sicherheitsprüfung nach Abschluss</li>
                  <li>Moderne FI-Schutzschalter sind Pflicht, nicht optional</li>
                  <li>Bei Altbauten: Prüfen Sie, ob die Leitungsquerschnitte ausreichen</li>
                </ul>
              </>
            )}
            {majorCategorySlug === 'heizung-klima' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Heizung & Klima: Gut geplant spart Geld
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Eine neue Heizung ist eine langfristige Investition. Moderne Wärmepumpen sind zwar teurer in der Anschaffung, rechnen sich aber über die Betriebskosten – vor allem, wenn Sie Fördergelder nutzen. Bund und Kantone unterstützen den Umstieg von fossilen Heizungen auf erneuerbare Systeme mit bis zu mehreren tausend Franken.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Was passt zu Ihrem Haus?
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Nicht jede Heizung passt zu jedem Gebäude. Wärmepumpen funktionieren am besten in gut gedämmten Häusern mit Fussbodenheizung oder grossen Radiatoren. Ältere, schlecht isolierte Häuser brauchen höhere Vorlauftemperaturen – da kann eine Pelletheizung die bessere Wahl sein.
                </p>

                <p className="text-lg leading-relaxed">
                  Ein guter Heizungsinstallateur nimmt sich Zeit für eine Bestandsaufnahme: Wie ist die Dämmung? Welche Heizkörper sind vorhanden? Wie hoch ist Ihr Wärmebedarf? Erst dann schlägt er Ihnen passende Lösungen vor.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Planen Sie Heizungssanierungen im Frühling oder Sommer</li>
                  <li>Lassen Sie sich bei Förderanträgen helfen – viele Installateure übernehmen das</li>
                  <li>Regelmässige Wartung verlängert die Lebensdauer erheblich</li>
                  <li>Kombination mit Solarthermie kann sich lohnen</li>
                </ul>
              </>
            )}
            {majorCategorySlug === 'sanitaer' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Sanitärinstallationen: Mehr als nur Rohre verlegen
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Ein neues Bad ist mehr als Handwerk – es ist Koordination. Sanitär, Elektro, Plattenleger, manchmal auch Schreiner: Alle Gewerke müssen in der richtigen Reihenfolge arbeiten. Ein erfahrener Sanitärinstallateur übernimmt diese Koordination und stellt sicher, dass keine Schnittstelle vergessen geht.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Badsanierung: Die richtige Reihenfolge zählt
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Erst kommen die Rohre, dann die Abdichtung, dann die Fliesen, zuletzt die Montage. Diese Reihenfolge ist fix – wer hier Fehler macht, zahlt doppelt. Abdichtungsfehler zeigen sich oft erst nach Jahren, wenn Wasser in die Decke darunter sickert.
                </p>

                <p className="text-lg leading-relaxed">
                  Bodengleiche Duschen sind beliebt, aber nicht überall machbar. Die Geschossdecke muss genug hoch sein, um die Ablaufleitungen zu verstecken. Vorwandinstallationen bieten mehr Flexibilität und erleichtern spätere Reparaturen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Was Sie beachten sollten
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Wassersparende Armaturen amortisieren sich schnell</li>
                  <li>In Gebieten mit hartem Wasser lohnt sich eine Enthärtungsanlage</li>
                  <li>Warmwasser sollte mindestens 60°C erreichen (Legionellenschutz)</li>
                  <li>Qualität bei Abdichtung zahlt sich langfristig aus</li>
                </ul>
              </>
            )}
            {majorCategorySlug === 'bau-renovation' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Bau & Renovation: Gut planen, besser bauen
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Umbauen ist oft komplexer als Neubauen. Sie müssen mit Überraschungen rechnen – veraltete Leitungen, Bausubstanz, die nicht den Erwartungen entspricht, unvorhergesehene statische Probleme. Ein erfahrener Bauunternehmer rechnet solche Risiken ein und plant Pufferzeiten.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Baubewilligungen nicht unterschätzen
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Fast alle Umbauten brauchen eine Bewilligung – auch wenn Sie &quot;nur&quot; ein Fenster vergrössern oder eine Wand entfernen. Was bewilligungspflichtig ist, regelt jede Gemeinde etwas anders. Ihr Bauunternehmer sollte die lokalen Vorschriften kennen und Sie bei den Anträgen unterstützen.
                </p>

                <p className="text-lg leading-relaxed">
                  Rechnen Sie mit 2-4 Monaten für das Bewilligungsverfahren. In dieser Zeit können Sie die Detailplanung verfeinern und Materialien auswählen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Koordination ist alles
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Bei grösseren Renovationen arbeiten oft fünf bis zehn verschiedene Gewerke zusammen. Wer koordiniert, wann welcher Handwerker kommt? Wer bestellt Material? Wer kontrolliert Qualität und Termine? Ein Generalunternehmer oder Bauleiter nimmt Ihnen diese Arbeit ab.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Planen Sie 10-15% Budget-Reserve für Unvorhergesehenes ein</li>
                  <li>Fixpreisofferten geben Kostensicherheit</li>
                  <li>Lassen Sie Zwischenabrechnungen von einem Fachmann prüfen</li>
                  <li>Dokumentieren Sie den Baufortschritt mit Fotos</li>
                </ul>
              </>
            )}
            
            {majorCategorySlug === 'bodenbelaege' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Bodenbeläge: Welcher Boden passt zu welchem Raum?
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Der richtige Bodenbelag ist mehr als eine Frage des Geschmacks. Im Eingang brauchen Sie etwas Robustes, das Schmutz verträgt. Im Wohnbereich zählt Gemütlichkeit. In Feuchträumen wie dem Bad muss der Boden wasserfest sein. Die Wahl beeinflusst nicht nur das Aussehen, sondern auch die Langlebigkeit und den Pflegeaufwand.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Parkett, Laminat oder Vinyl?
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Echtholzparkett sieht edel aus und lässt sich mehrmals abschleifen – hält also Jahrzehnte. Dafür ist es teurer und empfindlicher gegenüber Feuchtigkeit. Laminat ist günstiger, sieht modern auch gut aus, lässt sich aber nicht renovieren. Vinylböden sind wasserfest, fusswarm und pflegeleicht – ideal für Küchen und Bäder.
                </p>

                <p className="text-lg leading-relaxed">
                  Ein guter Bodenleger berät Sie ehrlich: Wo lohnt sich die Investition in Echtholz, wo reicht eine günstigere Lösung? Wichtig ist auch der Unterbau: Eine gute Trittschalldämmung ist besonders in Mietwohnungen Pflicht und verhindert Ärger mit den Nachbarn.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Lassen Sie das Material vor dem Verlegen 48 Stunden im Raum akklimatisieren</li>
                  <li>In Mietwohnungen: Prüfen Sie die Anforderungen an die Trittschalldämmung</li>
                  <li>Bei Fussbodenheizung: Nicht jedes Material ist geeignet</li>
                  <li>Fliesen in Feuchträumen: Achten Sie auf rutschfeste Oberflächen</li>
                </ul>
              </>
            )}
            
            {majorCategorySlug === 'kueche' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Küche: Von der Planung bis zur Montage
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Eine neue Küche ist eine langfristige Investition. Die Planung beginnt mit präzisen Massaufnahmen – jeder Zentimeter zählt. Wo verlaufen Wasser- und Stromleitungen? Wo sind tragende Wände? Moderne Küchenbauer erstellen digitale 3D-Pläne, damit Sie sich Ihre neue Küche vorab vorstellen können.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Koordination zwischen Gewerken
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Nach der Planung kommt die Bestellung – und hier braucht es Geduld. Hochwertige Küchen haben oft Lieferzeiten von 8-12 Wochen. In dieser Zeit können Elektriker und Sanitär ihre Vorarbeiten erledigen: Steckdosen versetzen, Anschlüsse vorbereiten, eventuell Wände neu verputzen.
                </p>

                <p className="text-lg leading-relaxed">
                  Die Montage selbst dauert meist nur 1-2 Tage. Danach kommen Elektriker und Sanitär nochmals für die Endmontage. Ein erfahrener Küchenbauer koordiniert diese Termine und stellt sicher, dass alle Handwerker wissen, wann sie gebraucht werden.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Wo investieren, wo sparen?
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Investieren Sie in gute Scharniere und Schubladenauszüge – das sind die Teile, die Sie täglich nutzen. Bei den Fronten ist der Preis oft eine Geschmacksfrage. Grifflose Küchen sehen modern aus, kosten aber mehr. Geräte können Sie auch nachträglich upgraden – die Korpusse bleiben meist 20 Jahre und länger.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Planen Sie genug Arbeitsfläche zwischen Herd und Spüle ein</li>
                  <li>Steckdosen über der Arbeitsplatte sind praktischer als versteckte Lösungen</li>
                  <li>LED-Beleuchtung unter Hängeschränken kostet wenig, bringt viel</li>
                  <li>Schubladen sind praktischer als Unterschränke mit Türen</li>
                </ul>
              </>
            )}
            
            {majorCategorySlug === 'innenausbau-schreiner' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Innenausbau & Schreinerarbeiten: Massarbeit für Ihr Zuhause
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Standardmöbel passen selten perfekt. Schräge Wände, Nischen, ungewöhnliche Raumhöhen – oft braucht es Massanfertigungen, um den Raum optimal zu nutzen. Ein guter Schreiner denkt mit: Wo braucht es Stauraum? Wie lassen sich Kabel verstecken? Welches Holz passt zum Rest der Einrichtung?
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Massanfertigungen: Vorlaufzeit einplanen
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Hochwertige Schreinerarbeiten brauchen Zeit. Vom Erstgespräch bis zur Montage vergehen oft 6-10 Wochen – bei komplexen Projekten auch länger. Die Planung ist entscheidend: Präzise Masse, durchdachte Details, Materialauswahl. Wer hier sorgfältig arbeitet, vermeidet teure Nachbesserungen.
                </p>

                <p className="text-lg leading-relaxed">
                  Bei Einbaumöbeln spielen auch andere Gewerke eine Rolle: Braucht es zusätzliche Steckdosen? Beleuchtung? Müssen Wände vorbereitet werden? Klären Sie das frühzeitig, damit bei der Montage keine Überraschungen auftauchen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Holzarten und Oberflächen
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Massivholz ist robust und lässt sich renovieren, arbeitet aber – verzieht sich also leicht bei wechselnder Luftfeuchtigkeit. Furnierte Platten sind formstabiler und günstiger, sehen bei guter Verarbeitung aber fast gleich aus. Lackierte Oberflächen sind pflegeleicht, geöltes Holz fühlt sich natürlicher an, braucht aber regelmässige Pflege.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Fragen Sie nach Referenzprojekten – gute Schreiner zeigen gerne ihre Arbeit</li>
                  <li>Klären Sie, ob Lieferung und Montage im Preis enthalten sind</li>
                  <li>Bei grossen Möbeln: Passt es durch Türen und Treppenhaus?</li>
                  <li>Lassen Sie sich Holzmuster zeigen – Farben wirken im Raum anders als im Katalog</li>
                </ul>
              </>
            )}
            
            {majorCategorySlug === 'raeumung-entsorgung' && (
              <>
                <h2 className="text-3xl font-bold text-ink-900 mb-6">
                  Räumung & Entsorgung: Professionelle Hilfe bei grossen Aufgaben
                </h2>
                
                <p className="text-lg leading-relaxed">
                  Wohnungsräumungen sind oft emotional belastend – nach einem Todesfall, vor einem Umzug, bei einer Messie-Wohnung. Professionelle Räumungsfirmen übernehmen nicht nur die körperliche Arbeit, sondern auch die fachgerechte Entsorgung und arbeiten diskret. Sie wissen, was in den Kehricht darf, was recycelt werden muss und was noch Wert hat.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Kosten: Wovon hängen sie ab?
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Der Preis richtet sich nach der Menge, der Zugänglichkeit und der Art des Materials. Eine 3-Zimmer-Wohnung im Erdgeschoss ist günstiger als dieselbe Wohnung im 4. Stock ohne Lift. Sperrmüll und Sondermüll (Farben, Chemikalien, Elektroschrott) kosten extra, weil sie speziell entsorgt werden müssen.
                </p>

                <p className="text-lg leading-relaxed">
                  Viele unterschätzen die Entsorgungsgebühren. In der Schweiz ist die Abfallentsorgung teuer – besonders bei grossen Mengen. Seriöse Firmen rechnen transparent ab und geben Ihnen vorab eine Schätzung. Bei Haushaltsauflösungen können wertvolle Gegenstände (Antiquitäten, funktionierende Möbel) die Kosten teilweise ausgleichen.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Fristen einhalten
                </h3>
                
                <p className="text-lg leading-relaxed">
                  Bei Wohnungswechseln zählt jeder Tag. Steht die Abgabe der Wohnung bevor, müssen Sie terminlich sicher planen. Professionelle Räumungsfirmen schaffen eine durchschnittliche Wohnung in 1-2 Tagen – inklusive Endreinigung. Wichtig: Buchen Sie frühzeitig, besonders Ende Monat und am Quartalsende sind die Firmen oft ausgelastet.
                </p>

                <h3 className="text-2xl font-semibold text-ink-900 mt-8 mb-4">
                  Praktische Tipps
                </h3>
                
                <ul className="list-disc pl-6 space-y-2 text-lg">
                  <li>Sortieren Sie vorher aus, was Sie behalten wollen – spart Kosten</li>
                  <li>Fragen Sie nach Pauschalpreisen statt Stundenansätzen</li>
                  <li>Klären Sie, ob Endreinigung im Preis enthalten ist</li>
                  <li>Bei Erbschaften: Bewahren Sie wichtige Dokumente separat auf</li>
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
