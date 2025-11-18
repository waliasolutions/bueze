import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqData = [
  {
    category: 'Anfrage erstellen',
    questions: [
      {
        q: 'Was gehört in eine gute Handwerker-Anfrage?',
        a: 'Damit Handwerker eine faire und präzise Offerte erstellen können, sollte Ihre Anfrage Ihr Projekt so klar wie möglich beschreiben. Geben Sie an, was gemacht werden soll, bis wann, und – wenn möglich – fügen Sie Fotos oder Pläne hinzu. Auch eine grobe Budgetvorstellung hilft den Handwerkern, Ihnen passende Angebote zu senden. Je genauer Ihre Angaben, desto reibungsloser verläuft der Ablauf.'
      },
      {
        q: 'Wie prüft Büeze.ch meine Anfrage?',
        a: 'Bevor Ihre Anfrage online geht, wird sie von unserem Team sorgfältig geprüft. Wir achten darauf, dass alle wichtigen Informationen vorhanden sind und das Projekt in die richtige Kategorie passt. So stellen wir sicher, dass nur klare und vollständige Anfragen an die passenden Handwerker weitergeleitet werden.'
      },
      {
        q: 'Was kostet eine Anfrage bei Büeze.ch?',
        a: 'Das Erstellen einer Anfrage ist für Sie als Auftraggeber komplett kostenlos und unverbindlich. Sie zahlen nur die Kosten, die Sie direkt mit dem Handwerker für die Ausführung der Arbeit vereinbaren. Büeze.ch finanziert sich ausschliesslich über Abonnements für Handwerksbetriebe, nicht über Vermittlungsgebühren.'
      }
    ]
  },
  {
    category: 'Anfrage bearbeiten oder beenden',
    questions: [
      {
        q: 'Wie kann ich meine Anfrage nachträglich anpassen?',
        a: 'Sie können Ihre Anfrage jederzeit über Ihr Dashboard bearbeiten. Unter „Meine Anfragen" wählen Sie einfach das gewünschte Projekt aus und klicken auf „Bearbeiten". Dort lassen sich auch zusätzliche Bilder oder Dokumente hochladen, damit Handwerker Ihr Projekt noch besser einschätzen können.'
      },
      {
        q: 'Kann ich meine Anfrage verlängern oder vorzeitig beenden?',
        a: 'Ja. Läuft Ihre Anfrage bald ab oder ist sie bereits abgelaufen, können Sie sie mit einem Klick kostenlos verlängern – so bleibt sie weiterhin für Handwerker sichtbar. Wenn Sie das Projekt nicht mehr ausschreiben möchten, können Sie Ihre Anfrage ebenfalls jederzeit über das Dashboard schließen. Bereits eingegangene Offerten bleiben selbstverständlich erhalten.'
      }
    ]
  },
  {
    category: 'Offerten verwalten',
    questions: [
      {
        q: 'Wie nehme oder lehne ich eine Offerte an?',
        a: 'Wenn Ihnen eine Offerte zusagt, können Sie dem Handwerker direkt über die Nachrichtenfunktion zusagen. Wir empfehlen, die Details persönlich zu besprechen und einen schriftlichen Vertrag abzuschließen. Falls Sie sich für ein anderes Angebot entscheiden, können Sie den Handwerkern einfach kurz und freundlich absagen – das wird geschätzt, ist aber nicht zwingend erforderlich.'
      },
    {
      q: 'Bin ich verpflichtet, über Büeze.ch einen Handwerker zu wählen?',
      a: 'Nein. Büeze.ch ist für Sie komplett unverbindlich. Sie entscheiden selbst, ob und mit wem Sie zusammenarbeiten möchten. Erst durch den direkten Vertragsabschluss mit einem Handwerker entsteht ein rechtsgültiger Auftrag.'
    }
  ]
},
{
  category: 'Für Handwerker',
  questions: [
    {
      q: 'Wie werde ich als Handwerker verifiziert?',
      a: 'Nach Ihrer Registrierung prüfen wir Ihre Angaben manuell, um sicherzustellen, dass nur vertrauenswürdige und qualifizierte Fachbetriebe Zugang zu den Kundenanfragen erhalten. Diese Überprüfung dient dem Schutz unserer Auftraggeber und stärkt die Qualität auf der Plattform. In der Regel dauert sie 1–2 Werktage. Nach der Freischaltung erhalten Sie eine Bestätigungs-E-Mail und können direkt loslegen.'
    },
    {
      q: 'Wie funktioniert die Preisgestaltung für Handwerker?',
      a: 'Im kostenlosen Free-Plan sind 5 Offerten pro Monat enthalten. Mit einem Abo (Monatlich CHF 90, 6 Monate CHF 510, Jährlich CHF 960) können Sie unbegrenzt Offerten einreichen. Sobald ein Kunde Ihre Offerte akzeptiert, erhalten beide Seiten die vollständigen Kontaktdaten – ohne Zusatzkosten pro Kontakt. Sie zahlen nur für das Abo, nicht für einzelne Vermittlungen.'
    },
    {
      q: 'Was passiert, wenn der Kunde meine Offerte nicht akzeptiert?',
      a: 'Abgelehnte Offerten werden nicht auf Ihr monatliches Kontingent angerechnet. Nur eingereichte Offerten zählen zu Ihrer Limite von 5 Offerten im Free-Plan. Bei Ablehnung durch den Kunden entstehen keine zusätzlichen Kosten und Ihr Kontingent bleibt unberührt.'
    },
    {
      q: 'Welche Informationen sehen Auftraggeber von mir?',
      a: 'Ihr Profil wird erst nach der Überprüfung für passende Anfragen freigeschaltet. Ihre Kontaktdaten bleiben geschützt, bis Sie selbst den Kontakt zu einem Auftraggeber aufnehmen. So behalten Sie jederzeit die Kontrolle über Ihre Sichtbarkeit und Anfragen.'
    },
    {
      q: 'Kann ich mein Profil später anpassen?',
      a: 'Ja. In Ihrem Dashboard können Sie Ihre Angaben jederzeit aktualisieren – etwa Fachbereiche, Einsatzgebiete oder Stundensätze. So bleibt Ihr Profil immer auf dem neuesten Stand.'
    },
    {
      q: 'Muss ich auf jede Anfrage reagieren?',
      a: 'Nein. Sie entscheiden selbst, welche Projekte für Sie interessant sind – es gibt keine Verpflichtung, auf jede Anfrage zu antworten. Beachten Sie jedoch: Wenn Sie nicht zeitnah reagieren, kann Ihre Anfrage je nach Dringlichkeit des Auftrags innerhalb weniger Stunden oder Tage an weitere Anbieter weitergeleitet werden. Im Dashboard sehen Sie auch die Dringlichkeit der einzelnen Aufträge, damit Sie selbst einschätzen können, welche Projekte Sie bevorzugt bearbeiten möchten. So behalten Sie volle Flexibilität, ohne Chancen zu verpassen.'
    }
  ]
}
];

export const FAQ = () => {
  return (
    <section className="py-20 bg-pastel-blue-50">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
          Häufig gestellte Fragen
        </h2>
        <p className="text-xl text-ink-700">
          Alles, was Sie über Büeze.ch wissen müssen
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="container mx-auto px-4 max-w-4xl">
        {faqData.map((category, idx) => (
          <div key={idx} className="mb-12 last:mb-0">
            <h3 className="text-2xl font-bold text-ink-900 mb-6">
              {category.category}
            </h3>
            <Accordion type="single" collapsible className="space-y-4">
              {category.questions.map((item, qIdx) => (
                <AccordionItem
                  key={qIdx}
                  value={`item-${idx}-${qIdx}`}
                  className="bg-white rounded-lg shadow-sm border border-border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-ink-900 hover:text-brand-600 py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-700 leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
};
