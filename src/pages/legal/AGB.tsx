import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { generateWebPageSchema, wrapInGraph } from '@/lib/schemaHelpers';

const AGB = () => {
  const schemaMarkup = wrapInGraph(
    generateWebPageSchema(
      "Allgemeine Geschäftsbedingungen (AGB)",
      "Die Allgemeinen Geschäftsbedingungen für die Nutzung der Handwerker-Vermittlungsplattform Büeze.ch in der Schweiz.",
      "https://bueeze.ch/legal/agb"
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title="Allgemeine Geschäftsbedingungen (AGB) | Büeze.ch"
        description="Die Allgemeinen Geschäftsbedingungen für die Nutzung der Handwerker-Vermittlungsplattform Büeze.ch in der Schweiz."
        canonical="https://bueeze.ch/legal/agb"
        robotsMeta="index,follow"
        schemaMarkup={schemaMarkup}
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
              <p className="text-muted-foreground">Letzte Aktualisierung: {new Date().toLocaleDateString('de-CH')}</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Geltungsbereich</h2>
                <p className="text-ink-700 mb-4">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Online-Plattform BÜEZE.CH (nachfolgend „Plattform") der
                  Büeze GmbH, Gotthardstrasse 37, 6410 Goldau, Schweiz.
                </p>
                <p className="text-ink-700 mb-4">
                  Sie gelten für alle Nutzerinnen und Nutzer der Plattform, insbesondere:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Handwerksbetriebe („Handwerker")</li>
                  <li>Auftraggeber („Kunden")</li>
                </ul>
                <p className="text-ink-700 mb-4">
                  Mit der Registrierung oder Nutzung der Plattform erklären sich die Nutzer mit diesen AGB einverstanden.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Zweck der Plattform</h2>
                <p className="text-ink-700 mb-4">
                  BÜEZE.CH ist eine digitale Vermittlungsplattform, die Auftraggeber und Handwerksbetriebe miteinander verbindet.
                  Kunden können Aufträge veröffentlichen, während Handwerker diese Aufträge einsehen und bei Interesse Kontakt aufnehmen können.
                </p>
                <p className="text-ink-700 mb-4">
                  BÜEZE.CH stellt ausschliesslich die technische Infrastruktur zur Verfügung und ist kein Vertragspartner der vermittelten Leistungen.
                  Verträge über Handwerksarbeiten kommen ausschliesslich zwischen dem Handwerker und dem Auftraggeber zustande.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Registrierung und Nutzung</h2>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Die Nutzung der Plattform setzt eine Registrierung mit vollständigen und wahrheitsgemässen Angaben voraus.</li>
                  <li>Benutzerkonten sind persönlich und dürfen nicht an Dritte übertragen werden.</li>
                  <li>BÜEZE.CH behält sich das Recht vor, Registrierungen oder Benutzer ohne Angabe von Gründen zu sperren oder zu löschen, insbesondere bei Falschangaben, Missbrauch oder Verstoss gegen diese AGB.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Leistungsumfang und Abonnements</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.1 Offertenprozess</h3>
                  <ol className="list-decimal pl-6 text-ink-700 space-y-2">
                    <li>Handwerker sehen neue Anfragen mit: PLZ, Ort (Stadt), Projektbeschreibung, Budget, Kategorie</li>
                    <li>Handwerker haben 10 Tage Zeit, eine Offerte einzureichen</li>
                    <li>Offerte enthält: Preisrahmen, Zeitschätzung, persönliche Nachricht, optionale Anhänge</li>
                    <li>Kunde erhält Benachrichtigung über neue Offerte</li>
                    <li>Kunde kann Offerte annehmen oder ablehnen</li>
                    <li>Bei Annahme: Beide Parteien erhalten vollständige Kontaktdaten (Name, Telefon, E-Mail, Adresse)</li>
                    <li>Pro Anfrage kann nur eine Offerte angenommen werden</li>
                    <li>Nach Annahme wird automatisch ein Conversation-Thread erstellt</li>
                  </ol>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.2 Kontingente und Limits</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>Free-Nutzer: 5 Offerten pro Monat, Reset am 1. des Folgemonats</li>
                    <li>Abo-Nutzer (Monatlich, 6-Monate, Jährlich): Unbegrenzte Offerten</li>
                    <li>Abgelehnte Offerten werden nicht auf das Kontingent angerechnet</li>
                    <li>Nur eingereichte Offerten zählen zur monatlichen Limite</li>
                    <li>10-Tage-Frist für Offerteneingabe pro Anfrage</li>
                  </ul>
                </div>

                <p className="text-ink-700 mb-4">
                  BÜEZE.CH bietet Handwerkern folgende Nutzungspakete an:
                </p>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.3 Free-Paket</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>Kostenlos nutzbar</li>
                    <li>5 Offerten pro Monat</li>
                    <li>Zugriff auf alle aktiven Anfragen</li>
                    <li>Kontaktdaten nach Annahme durch Kunden</li>
                    <li>10-Tage-Frist für Offerteneingabe</li>
                  </ul>
                  <p className="text-ink-700 mt-2 italic">Ideal zum Testen – keine versteckten Kosten.</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.4 Monatliches Abo</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>CHF 90 / Monat</li>
                    <li>Unbegrenzte Offerten</li>
                    <li>Erweiterte Suchfilter und Benachrichtigungen</li>
                    <li>Kontaktdaten nach Annahme durch Kunden</li>
                    <li>Laufzeit: 1 Monat</li>
                    <li>Verlängert sich automatisch um jeweils 1 weiteren Monat, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.5 6-Monats-Abo</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>CHF 510 / 6 Monate (–10 %)</li>
                    <li>Unbegrenzte Offerten</li>
                    <li>Erweiterte Suchfilter und Benachrichtigungen</li>
                    <li>Sofortiger Zugriff auf alle aktiven Anfragen</li>
                    <li>Priorisierte Verifizierung neuer Profile</li>
                    <li>Laufzeit: 6 Monate</li>
                    <li>Verlängert sich automatisch um weitere 6 Monate, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4.6 Jahresabo</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>CHF 960 / Jahr (–20 %)</li>
                    <li>Unbegrenzte Offerten</li>
                    <li>Erweiterte Suchfilter und Benachrichtigungen</li>
                    <li>Sofortiger Zugriff auf alle aktiven Anfragen</li>
                    <li>Priorisierte Verifizierung neuer Profile</li>
                    <li>Laufzeit: 12 Monate</li>
                    <li>Verlängert sich automatisch um 12 Monate, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                  </ul>
                </div>

                <p className="text-ink-700 font-semibold">
                  Alle Preise verstehen sich exkl. MwSt.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Zahlung und Freischaltung</h2>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Alle Leistungen werden im Voraus bezahlt.</li>
                  <li>Die Bezahlung erfolgt über die auf der Plattform angebotenen Zahlungsmethoden (z. B. Kreditkarte, Twint, PostFinance, Banküberweisung).</li>
                  <li>Nach erfolgter Zahlung wird der gebuchte Leistungsumfang sofort freigeschaltet.</li>
                  <li>Da alle Zahlungen im Voraus erfolgen, besteht kein Zahlungsverzug.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Vertragsdauer und Kündigung</h2>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Die Vertragsdauer richtet sich nach der gewählten Abolaufzeit.</li>
                  <li>Ohne fristgerechte Kündigung verlängert sich das Abo automatisch um die gleiche Laufzeit.</li>
                  <li>Eine Kündigung kann ausschliesslich über den vorgesehenen Kündigungs-Button im Benutzerkonto erfolgen.</li>
                  <li>Die Kündigung muss spätestens 1 Tag vor Ablauf der aktuellen Laufzeit erfolgen.</li>
                  <li>Nach erfolgter Kündigung läuft das Abo bis zum Ende der bereits bezahlten Laufzeit weiter; bezahlte Beträge werden nicht rückerstattet.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Haftungsausschluss</h2>
                <p className="text-ink-700 mb-4">
                  BÜEZE.CH haftet nicht für:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>die Richtigkeit, Vollständigkeit oder Qualität der von Nutzern bereitgestellten Informationen,</li>
                  <li>das Zustandekommen, die Durchführung oder Nichterfüllung eines Auftrags zwischen Handwerker und Kunde,</li>
                  <li>Schäden, die durch technische Störungen, fehlerhafte Nutzung oder unbefugten Zugriff Dritter entstehen.</li>
                </ul>
                <p className="text-ink-700 mt-4">
                  BÜEZE.CH betreibt die Plattform mit der gebotenen Sorgfalt, kann jedoch keine ununterbrochene Verfügbarkeit garantieren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Datenschutz</h2>
                <p className="text-ink-700 mb-4">
                  Der Schutz personenbezogener Daten hat für BÜEZE.CH oberste Priorität.
                  Alle Daten werden gemäss dem Schweizer Datenschutzgesetz (DSG) verarbeitet.
                  Einzelheiten sind in der separaten Datenschutzerklärung geregelt.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Geistiges Eigentum</h2>
                <p className="text-ink-700 mb-4">
                  Alle Inhalte, Texte, Logos, Designs und Softwareelemente der Plattform sind Eigentum der Büeze GmbH oder entsprechend lizenziert.
                  Jegliche Nutzung ausserhalb der Plattform bedarf der schriftlichen Zustimmung.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Änderungen der AGB</h2>
                <p className="text-ink-700 mb-4">
                  BÜEZE.CH behält sich das Recht vor, diese AGB jederzeit zu ändern.
                  Änderungen werden auf der Website veröffentlicht und gelten ab dem Veröffentlichungsdatum als akzeptiert.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">11. Anwendbares Recht und Gerichtsstand</h2>
                <p className="text-ink-700 mb-4">
                  Es gilt ausschliesslich Schweizer Recht.
                  Gerichtsstand ist Schwyz, Schweiz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
                <p className="text-ink-700 mb-2">
                  <strong>BÜEZE.CH</strong><br />
                  Büeze GmbH<br />
                  Gotthardstrasse 37<br />
                  6410 Goldau SZ<br />
                  Telefon: +41 41 558 22 33<br />
                  E-Mail: info@bueeze.ch<br />
                  www.bueeze.ch
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
