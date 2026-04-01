import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { generateWebPageSchema, wrapInGraph } from '@/lib/schemaHelpers';
import { useBillingContext } from '@/contexts/BillingSettingsProvider';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/config/subscriptionPlans';

const AGB = () => {
  const { settings: b } = useBillingContext();
  const plans = SUBSCRIPTION_PLANS;

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
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
            <p className="text-muted-foreground">Letzte Aktualisierung: {new Date().toLocaleDateString('de-CH')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">

            {/* §1 Geltungsbereich */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Geltungsbereich</h2>
              <p className="text-ink-700 mb-4">
                Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Online-Plattform BÜEZE.CH
                (nachfolgend «Plattform») der {b.company_legal_name}, {b.company_street}, {b.company_zip} {b.company_city}, {b.company_country}.
              </p>
              <p className="text-ink-700 mb-4">
                Sie gelten für alle Nutzerinnen und Nutzer der Plattform, insbesondere:
              </p>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Handwerksbetriebe («Handwerker»)</li>
                <li>Auftraggeber («Kunden»)</li>
              </ul>
              <p className="text-ink-700 mb-4 mt-4">
                Mit der Registrierung oder Nutzung der Plattform erklären sich die Nutzer mit diesen AGB einverstanden.
              </p>
            </section>

            {/* §2 Zweck der Plattform */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Zweck der Plattform</h2>
              <p className="text-ink-700 mb-4">
                BÜEZE.CH ist eine digitale Vermittlungsplattform, die Auftraggeber und Handwerksbetriebe
                miteinander verbindet. Kunden können Aufträge veröffentlichen, während Handwerker diese
                Aufträge einsehen und bei Interesse Kontakt aufnehmen können.
              </p>
              <p className="text-ink-700 mb-4">
                BÜEZE.CH stellt ausschliesslich die technische Infrastruktur zur Verfügung und ist kein
                Vertragspartner der vermittelten Leistungen. Verträge über Handwerksarbeiten kommen
                ausschliesslich zwischen dem Handwerker und dem Auftraggeber zustande.
              </p>
            </section>

            {/* §3 Registrierung und Nutzung */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Registrierung und Nutzung</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Die Nutzung der Plattform setzt eine Registrierung mit vollständigen und wahrheitsgemässen Angaben voraus.</li>
                <li>Benutzerkonten sind persönlich und dürfen nicht an Dritte übertragen werden.</li>
                <li>BÜEZE.CH behält sich das Recht vor, Registrierungen oder Benutzerkonten ohne Angabe von Gründen zu sperren oder zu löschen, insbesondere bei Falschangaben, Missbrauch oder Verstoss gegen diese AGB.</li>
              </ul>
            </section>

            {/* §4 Leistungsumfang und Abonnements */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Leistungsumfang und Abonnements</h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.1 Offertenprozess</h3>
                <ol className="list-decimal pl-6 text-ink-700 space-y-2">
                  <li>Handwerker sehen neue Anfragen mit: PLZ, Ort (Stadt), Projektbeschreibung, Budget und Kategorie.</li>
                  <li>Handwerker haben 10 Tage Zeit, eine Offerte einzureichen.</li>
                  <li>Die Offerte enthält: Preisrahmen, Zeitschätzung, persönliche Nachricht und optionale Anhänge.</li>
                  <li>Der Kunde erhält eine Benachrichtigung über die neue Offerte.</li>
                  <li>Der Kunde kann die Offerte annehmen oder ablehnen.</li>
                  <li>Bei Annahme erhalten beide Parteien vollständige Kontaktdaten (Name, Telefon, E-Mail, Adresse).</li>
                  <li>Pro Anfrage kann nur eine Offerte angenommen werden.</li>
                  <li>Nach Annahme wird automatisch ein Nachrichten-Thread erstellt.</li>
                </ol>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.2 Kontingente und Limits</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Free-Nutzer: {plans.free.proposalsLimit} Offerten pro Monat, Zurücksetzung am 1. des Folgemonats.</li>
                  <li>Abo-Nutzer (monatlich, 6 Monate, jährlich): unbegrenzte Offerten.</li>
                  
                  <li>Nur eingereichte Offerten zählen zur monatlichen Limite.</li>
                  <li>10-Tage-Frist für die Offerteneingabe pro Anfrage.</li>
                </ul>
              </div>

              <p className="text-ink-700 mb-4">
                BÜEZE.CH bietet Handwerkern folgende Nutzungspakete an:
              </p>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.3 Free-Paket</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Kostenlos nutzbar.</li>
                  <li>{plans.free.proposalsLimit} Offerten pro Monat.</li>
                  <li>Zugriff auf alle aktiven Anfragen.</li>
                  <li>Kontaktdaten nach Annahme durch den Kunden.</li>
                  <li>10-Tage-Frist für die Offerteneingabe.</li>
                </ul>
                <p className="text-ink-700 mt-2 italic">Ideal zum Testen – keine versteckten Kosten.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.4 Monatliches Abo</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>{formatPrice(plans.monthly.price)} pro Monat.</li>
                  <li>Unbegrenzte Offerten.</li>
                  <li>Erweiterte Suchfilter und Benachrichtigungen.</li>
                  <li>Kontaktdaten nach Annahme durch den Kunden.</li>
                  <li>Laufzeit: 1 Monat.</li>
                  <li>Verlängert sich automatisch um jeweils einen weiteren Monat, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.5 6-Monats-Abo</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>{formatPrice(plans['6_month'].price)} für 6 Monate ({plans['6_month'].savings}).</li>
                  <li>Unbegrenzte Offerten.</li>
                  <li>Erweiterte Suchfilter und Benachrichtigungen.</li>
                  <li>Sofortiger Zugriff auf alle aktiven Anfragen.</li>
                  <li>Priorisierte Verifizierung neuer Profile.</li>
                  <li>Laufzeit: 6 Monate.</li>
                  <li>Verlängert sich automatisch um weitere 6 Monate, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">4.6 Jahresabo</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>{formatPrice(plans.annual.price)} pro Jahr ({plans.annual.savings}).</li>
                  <li>Unbegrenzte Offerten.</li>
                  <li>Erweiterte Suchfilter und Benachrichtigungen.</li>
                  <li>Sofortiger Zugriff auf alle aktiven Anfragen.</li>
                  <li>Priorisierte Verifizierung neuer Profile.</li>
                  <li>Laufzeit: 12 Monate.</li>
                  <li>Verlängert sich automatisch um weitere 12 Monate, sofern nicht spätestens 1 Tag vor Ablauf über den Kündigungs-Button im Benutzerkonto gekündigt wird.</li>
                </ul>
              </div>

              <p className="text-ink-700 font-semibold">
                Alle Preise verstehen sich {b.mwst_note ? b.mwst_note.toLowerCase() : 'exkl. MwSt.'}.
              </p>
            </section>

            {/* §5 Zahlungsabwicklung (Payrexx) */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Zahlungsabwicklung (Payrexx)</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Sämtliche Zahlungen werden über den akkreditierten Schweizer Zahlungsdienstleister Payrexx AG abgewickelt.</li>
                <li>Payrexx ist PCI-DSS-zertifiziert. Kreditkarten- und Zahlungsdaten werden ausschliesslich von Payrexx verarbeitet und gespeichert; BÜEZE.CH speichert zu keinem Zeitpunkt Kartendaten.</li>
                <li>Es gelten ergänzend die Allgemeinen Geschäftsbedingungen der Payrexx AG (einsehbar unter payrexx.com).</li>
                <li>Unterstützte Zahlungsmethoden umfassen unter anderem Kreditkarte, TWINT, PostFinance und Banküberweisung.</li>
                <li>Nach erfolgter Zahlung wird der gebuchte Leistungsumfang sofort freigeschaltet.</li>
              </ul>
            </section>

            {/* §6 Zahlungsverzug */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Zahlungsverzug</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Alle Leistungen werden im Voraus bezahlt. Bei Nichtzahlung oder fehlgeschlagener Verlängerungszahlung wird das Konto automatisch auf das kostenlose Free-Paket ({plans.free.proposalsLimit} Offerten pro Monat) herabgestuft.</li>
                <li>Mit der Herabstufung entfallen sämtliche Vorteile des bisherigen Abonnements. Bereits laufende Offerten bleiben bestehen; neue Offerten unterliegen dem Free-Kontingent.</li>
                <li>BÜEZE.CH ist nicht verpflichtet, den Nutzer vor der Herabstufung gesondert zu mahnen.</li>
              </ul>
            </section>

            {/* §7 Vertragsdauer und Kündigung */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Vertragsdauer und Kündigung</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Die Vertragsdauer richtet sich nach der gewählten Abolaufzeit.</li>
                <li>Ohne fristgerechte Kündigung verlängert sich das Abo automatisch um die gleiche Laufzeit.</li>
                <li>Eine Kündigung kann ausschliesslich über den vorgesehenen Kündigungs-Button im Benutzerkonto erfolgen.</li>
                <li>Die Kündigung muss spätestens 1 Tag vor Ablauf der aktuellen Laufzeit erfolgen.</li>
                <li>Nach erfolgter Kündigung läuft das Abo bis zum Ende der bereits bezahlten Laufzeit weiter; bezahlte Beträge werden nicht rückerstattet.</li>
              </ul>
            </section>

            {/* §8 Stornierung und Rückerstattung */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Stornierung und Rückerstattung</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Bereits bezahlte Abonnements werden grundsätzlich nicht rückerstattet.</li>
                <li>Ausnahmen bestehen ausschliesslich bei:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>nachweislich doppelt ausgeführten Zahlungen;</li>
                    <li>technischen Fehlern der Plattform, die eine Nutzung des bezahlten Leistungsumfangs verunmöglicht haben.</li>
                  </ul>
                </li>
                <li>Rückerstattungsanträge sind schriftlich an {b.company_email} zu richten und müssen innerhalb von 30 Tagen nach der betreffenden Zahlung eingereicht werden.</li>
                <li>BÜEZE.CH prüft jeden Antrag einzeln und entscheidet nach eigenem Ermessen.</li>
              </ul>
            </section>

            {/* §9 Nicht angenommene Anfragen */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Nicht angenommene Anfragen</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Jede Anfrage hat eine Frist von 10 Tagen, innerhalb derer Handwerker Offerten einreichen können.</li>
                <li>BÜEZE.CH garantiert nicht, dass für jede Anfrage Offerten eingehen. Die Plattform ist ein Vermittlungsdienst, kein Leistungsversprechen.</li>
                <li>Nach Ablauf der 10-Tage-Frist ohne eingegangene Offerten verfällt die Anfrage automatisch.</li>
                <li>Der Kunde kann jederzeit eine neue, identische oder angepasste Anfrage erfassen.</li>
                <li>Das Erfassen von Anfragen ist für Kunden kostenlos und unbegrenzt möglich.</li>
              </ul>
            </section>

            {/* §10 Pflichten der Plattform */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Pflichten der Plattform</h2>
              <p className="text-ink-700 mb-4">BÜEZE.CH verpflichtet sich gegenüber allen Nutzern zu Folgendem:</p>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Gegenüber Kunden:</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Bereitstellung einer funktionierenden Plattform zur Erfassung von Anfragen und zum Empfang von Offerten.</li>
                  <li>Weiterleitung eingehender Offerten an den Auftraggeber.</li>
                  <li>Schutz personenbezogener Daten gemäss der Datenschutzerklärung.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Gegenüber Handwerkern:</h3>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Bereitstellung relevanter Anfragen gemäss den hinterlegten Kategorien und Servicegebieten.</li>
                  <li>Korrekte Abrechnung und transparente Darstellung des Abonnementstatus.</li>
                  <li>Sorgfältige Verwaltung der Profilverifizierung.</li>
                </ul>
              </div>
            </section>

            {/* §11 Bewertungen */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Bewertungen</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Bewertungen können ausschliesslich nach vollständiger Erledigung und Abschluss eines vermittelten Auftrags abgegeben werden.</li>
                <li>Es darf ausschliesslich die erbrachte handwerkliche Leistung bewertet werden; persönliche Angriffe, diskriminierende Äusserungen oder sachfremde Inhalte sind unzulässig.</li>
                <li>Pro abgeschlossenem Auftrag kann der Auftraggeber eine Bewertung abgeben (1–5 Sterne, optionaler Kommentar).</li>
                <li>Der bewertete Handwerker hat das Recht, auf eine Bewertung zu antworten.</li>
                <li>Bewertungen werden öffentlich angezeigt; dabei wird aus Datenschutzgründen nur der Vorname des Auftraggebers angezeigt.</li>
                <li>BÜEZE.CH behält sich das Recht vor, Bewertungen zu entfernen, die gegen diese AGB oder geltendes Recht verstossen.</li>
              </ul>
            </section>

            {/* §12 Haftungsausschluss (allgemein) */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Haftungsausschluss (allgemein)</h2>
              <p className="text-ink-700 mb-4">BÜEZE.CH haftet nicht für:</p>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>die Richtigkeit, Vollständigkeit oder Qualität der von Nutzern bereitgestellten Informationen;</li>
                <li>das Zustandekommen, die Durchführung oder Nichterfüllung eines Auftrags zwischen Handwerker und Kunde;</li>
                <li>Schäden, die durch technische Störungen, fehlerhafte Nutzung oder unbefugten Zugriff Dritter entstehen.</li>
              </ul>
              <p className="text-ink-700 mt-4">
                BÜEZE.CH betreibt die Plattform mit der gebotenen Sorgfalt, kann jedoch keine ununterbrochene Verfügbarkeit garantieren.
              </p>
            </section>

            {/* §13 Haftung gegenüber Kunden */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. Haftung gegenüber Kunden</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>BÜEZE.CH agiert ausschliesslich als Vermittlerin und ist nicht Vertragspartei der zwischen Kunde und Handwerker geschlossenen Vereinbarungen.</li>
                <li>BÜEZE.CH übernimmt keinerlei Haftung für die Qualität, Vollständigkeit, Terminierung oder Mängelfreiheit der durch Handwerker erbrachten Arbeiten.</li>
                <li>Reklamationen und Gewährleistungsansprüche sind direkt gegenüber dem jeweiligen Handwerker geltend zu machen.</li>
                <li>BÜEZE.CH prüft die Qualifikation und Zuverlässigkeit registrierter Handwerker im Rahmen des Verifizierungsprozesses, gibt jedoch keine Garantie für deren Leistungsfähigkeit.</li>
              </ul>
            </section>

            {/* §14 Haftung gegenüber Handwerkern */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">14. Haftung gegenüber Handwerkern</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>BÜEZE.CH garantiert weder eine Mindestanzahl an Anfragen noch ein bestimmtes Auftragsvolumen oder Umsatzniveau.</li>
                <li>Die Anzahl verfügbarer Anfragen hängt von der Nachfrage in der jeweiligen Region und Kategorie ab und kann variieren.</li>
                <li>Die Haftung von BÜEZE.CH gegenüber Handwerkern ist in jedem Fall auf die Höhe der im laufenden Abrechnungszeitraum bezahlten Abonnementgebühren beschränkt.</li>
                <li>Entgangener Gewinn, indirekte Schäden oder Folgeschäden sind von der Haftung ausgeschlossen.</li>
              </ul>
            </section>

            {/* §15 Datenschutz */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">15. Datenschutz</h2>
              <p className="text-ink-700 mb-4">
                Der Schutz personenbezogener Daten hat für BÜEZE.CH oberste Priorität.
                Alle Daten werden gemäss dem Schweizer Datenschutzgesetz (DSG) verarbeitet.
                Einzelheiten sind in der separaten Datenschutzerklärung geregelt.
              </p>
            </section>

            {/* §16 Geistiges Eigentum */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">16. Geistiges Eigentum</h2>
              <p className="text-ink-700 mb-4">
                Alle Inhalte, Texte, Logos, Designs und Softwareelemente der Plattform sind Eigentum
                der {b.company_legal_name} oder entsprechend lizenziert. Jegliche Nutzung ausserhalb
                der Plattform bedarf der schriftlichen Zustimmung.
              </p>
            </section>

            {/* §17 Anwendbares Recht und Gerichtsstand */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">17. Anwendbares Recht und Gerichtsstand</h2>
              <ul className="list-disc pl-6 text-ink-700 space-y-2">
                <li>Es gilt ausschliesslich liechtensteinisches Recht unter Ausschluss der kollisionsrechtlichen Verweisungsnormen.</li>
                <li>Ausschliesslicher Gerichtsstand ist Vaduz, Fürstentum Liechtenstein.</li>
                <li>Die Verfahrenssprache ist Deutsch.</li>
                <li>Vor Einleitung eines gerichtlichen Verfahrens ist der Nutzer verpflichtet, seine Beschwerde schriftlich an {b.company_email} zu richten. BÜEZE.CH verpflichtet sich, innerhalb von 30 Tagen eine Stellungnahme abzugeben.</li>
                <li>Den Parteien wird empfohlen, vor Anrufung eines Gerichts eine Mediation in Anspruch zu nehmen.</li>
                <li>Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt. An die Stelle der unwirksamen Bestimmung tritt eine wirksame Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.</li>
              </ul>
            </section>

            {/* §18 Änderungen der AGB */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">18. Änderungen der AGB</h2>
              <p className="text-ink-700 mb-4">
                BÜEZE.CH behält sich das Recht vor, diese AGB jederzeit zu ändern.
                Änderungen werden auf der Website veröffentlicht und gelten ab dem Veröffentlichungsdatum als akzeptiert.
              </p>
            </section>

            {/* Kontakt */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
              <p className="text-ink-700 mb-2">
                <strong>BÜEZE.CH</strong><br />
                {b.company_legal_name}<br />
                {b.company_street}<br />
                {b.company_zip} {b.company_city}<br />
                Telefon: {b.company_phone}<br />
                E-Mail: {b.company_email}<br />
                {b.company_website}
              </p>
            </section>

          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
