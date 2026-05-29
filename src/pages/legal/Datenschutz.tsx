import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { generateWebPageSchema, wrapInGraph } from '@/lib/schemaHelpers';
import { useBillingContext } from '@/contexts/BillingSettingsProvider';

const Datenschutz = () => {
  const { settings: b } = useBillingContext();
  const schemaMarkup = wrapInGraph(
    generateWebPageSchema(
      "Datenschutzerklärung",
      `Datenschutzerklärung der ${b.company_legal_name}. Erfahren Sie, wie wir Ihre Daten auf der Handwerker-Vermittlungsplattform schützen und verarbeiten.`,
      "https://bueeze.ch/datenschutz"
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title="Datenschutzerklärung | Büeze.ch"
        description={`Datenschutzerklärung der ${b.company_legal_name}. Erfahren Sie, wie wir Ihre Daten auf der Handwerker-Vermittlungsplattform schützen und verarbeiten.`}
        canonical="https://bueeze.ch/datenschutz"
        robotsMeta="index,follow"
        schemaMarkup={schemaMarkup}
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Datenschutzerklärung</CardTitle>
              <p className="text-muted-foreground">
                Letzte Aktualisierung: {new Date().toLocaleDateString('de-CH')}
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Verantwortliche Stelle</h2>
                <div className="text-ink-700 space-y-2">
                  <p><strong>{b.company_legal_name}</strong></p>
                  <p>{b.company_street}<br />{b.company_zip} {b.company_city}<br />{b.company_country}</p>
                  <p>
                    E-Mail:{' '}
                    <a href={`mailto:${b.company_email}`} className="text-brand-500 hover:text-brand-600">
                      {b.company_email}
                    </a>
                  </p>
                  <p>
                    Telefon:{' '}
                    <a href={`tel:${b.company_phone.replace(/\s/g, '')}`} className="text-brand-500 hover:text-brand-600">
                      {b.company_phone}
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Geltungsbereich</h2>
                <p className="text-ink-700">
                  Diese Datenschutzerklärung klärt Nutzer über die Art, den Umfang und Zwecke der Erhebung und Verwendung 
                  personenbezogener Daten durch die {b.company_legal_name} auf der Plattform {b.company_website} auf. Die Datenschutzerklärung 
                  gilt gemäss dem revidierten Schweizer Datenschutzgesetz (nDSG) sowie der EU-Datenschutz-Grundverordnung 
                  (DSGVO), soweit diese anwendbar ist.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Erhobene Daten</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">3.1 Personenbezogene Daten</h3>
                  <p className="text-ink-700 mb-2">Bei der Nutzung unserer Plattform erheben wir folgende Daten:</p>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse, Telefonnummer, Postleitzahl</li>
                    <li><strong>Handwerker-Profildaten:</strong> Firmenname, Adresse, Geschäftsführer, UID-Nummer, MWST-Nummer, 
                    Tätigkeitsbereiche, Servicezonen, Erfahrung, Zertifikate, Portfolio-Bilder</li>
                    <li><strong>Auftragsdaten:</strong> Projektbeschreibung, Budget, gewünschte Ausführungszeit, Fotos</li>
                    <li><strong>Kommunikationsdaten:</strong> Nachrichten zwischen Nutzern, Offerten, Kontaktdaten nach Annahme</li>
                    <li><strong>Bewertungsdaten:</strong> Sternebewertungen (1–5), optionale Kommentare, Antworten des Handwerkers; öffentlich wird nur der Vorname des Auftraggebers angezeigt</li>
                    <li><strong>Zahlungsdaten:</strong> Über Payrexx verarbeitete Zahlungsinformationen (Kreditkartendaten werden 
                    nicht bei uns gespeichert)</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">3.2 Technische Daten</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>IP-Adresse</li>
                    <li>Browser-Typ und -Version</li>
                    <li>Betriebssystem</li>
                    <li>Referrer URL</li>
                    <li>Datum und Uhrzeit der Anfrage</li>
                    <li>Cookie-Daten</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.3 Nutzungsdaten</h3>
                  <ul className="list-disc pl-6 text-ink-700 space-y-2">
                    <li>Seitenaufrufe und Verweildauer</li>
                    <li>Klickverhalten</li>
                    <li>Suchbegriffe</li>
                    <li>Abgeschlossene Aktionen (Lead-Erstellung, Offerten-Einreichung)</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Zweck der Datenverarbeitung</h2>
                <div className="text-ink-700 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">4.1 Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO / Art. 31 Abs. 2 lit. a nDSG)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Bereitstellung der Plattform-Funktionen</li>
                      <li>Vermittlung zwischen Auftraggebern und Handwerkern</li>
                      <li>Verarbeitung und Verwaltung von Aufträgen und Offerten</li>
                      <li>Abwicklung von Abonnements und Zahlungen</li>
                      <li>Kundensupport und Kommunikation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">4.2 Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO / Art. 31 Abs. 2 lit. a nDSG)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Verbesserung der Plattform und Nutzererfahrung</li>
                      <li>Betrugsbekämpfung und Sicherheit</li>
                      <li>Analyse der Plattformnutzung</li>
                      <li>Marketing und Werbung (mit Einwilligung)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">4.3 Gesetzliche Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO / Art. 31 Abs. 1 nDSG)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Erfüllung buchhalterischer und steuerlicher Pflichten</li>
                      <li>Aufbewahrung von Geschäftsunterlagen</li>
                      <li>Einhaltung von Compliance-Anforderungen</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Datenweitergabe an Dritte</h2>
                <p className="text-ink-700 mb-4">
                  Wir geben Ihre Daten nur in folgenden Fällen an Dritte weiter:
                </p>
                <p className="text-ink-700 mb-4">
                  <strong>Wichtig:</strong> Ihre personenbezogenen Daten werden ausschliesslich für die in dieser Datenschutzerklärung
                  genannten Zwecke verwendet – insbesondere für die Vermittlung zwischen Auftraggebern und Handwerkern sowie den
                  Betrieb der Plattform. Wir verkaufen Ihre Daten niemals an Dritte und geben sie auch nicht für andere als die
                  hier beschriebenen Zwecke weiter.
                </p>

                <div className="space-y-4 text-ink-700">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.1 Datenbank und Hosting (Supabase)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Anbieter:</strong> Supabase Inc. (Backend-as-a-Service)</li>
                      <li><strong>Zweck:</strong> Speicherung und Verwaltung aller Plattformdaten</li>
                      <li><strong>Standort:</strong> Deutschland (AWS eu-central-1, Frankfurt am Main). Sämtliche Daten werden auf Servern eines Partneranbieters (Amazon Web Services) in Deutschland gehostet.</li>
                      <li><strong>Datenschutz:</strong> Die Hosting-Infrastruktur befindet sich vollständig innerhalb der EU und entspricht den Anforderungen der DSGVO sowie des Schweizer Datenschutzgesetzes (nDSG). Supabase ist vertraglich als Auftragsverarbeiter gemäss Art. 9 nDSG gebunden.</li>
                      <li><strong>Verschlüsselung:</strong> Sämtliche Datenübertragungen zwischen Nutzern und unseren Servern erfolgen über hochgesicherte, verschlüsselte Kanäle (TLS 1.2+). Daten werden zudem verschlüsselt gespeichert (AES-256 at rest).</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.2 Payrexx (Zahlungsabwicklung Schweiz)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Zweck:</strong> Verarbeitung von Zahlungen über Schweizer Zahlungsmethoden</li>
                      <li><strong>Standort:</strong> Schweiz</li>
                      <li><strong>Datenschutz:</strong> <a href="https://www.payrexx.com/de-ch/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">https://www.payrexx.com/de-ch/legal/privacy</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.3 Supabase Storage (Dateispeicherung)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Zweck:</strong> Speicherung von Profilbildern, Portfolio-Fotos und Projektdokumenten</li>
                      <li><strong>Standort:</strong> Deutschland (AWS eu-central-1, Frankfurt am Main)</li>
                      <li><strong>Datenschutz:</strong> Dateien werden verschlüsselt gespeichert und nur authentifizierten Nutzern mit entsprechender Berechtigung zugänglich gemacht</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.4 SMTP2GO (E-Mail-Versand)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Zweck:</strong> Versand von Transaktions- und Benachrichtigungs-E-Mails</li>
                      <li><strong>Standort:</strong> Neuseeland</li>
                      <li><strong>Datenschutz:</strong> <a href="https://www.smtp2go.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">https://www.smtp2go.com/privacy</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.5 Google Analytics 4 (Webanalyse)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Zweck:</strong> Anonymisierte Analyse des Nutzerverhaltens</li>
                      <li><strong>Standort:</strong> USA (mit EU-Standardvertragsklauseln)</li>
                      <li><strong>IP-Anonymisierung:</strong> Aktiviert</li>
                      <li><strong>Datenschutz:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">https://policies.google.com/privacy</a></li>
                      <li><strong>Opt-Out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">Browser Add-on</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.6 Google Tag Manager (Tag-Verwaltung)</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Zweck:</strong> Verwaltung und Auslieferung von Website-Tags für Analyse und Marketing</li>
                      <li><strong>Standort:</strong> USA (mit EU-Standardvertragsklauseln)</li>
                      <li><strong>Datenverarbeitung:</strong> GTM selbst erhebt keine personenbezogenen Daten, ermöglicht aber die Einbindung anderer Dienste</li>
                      <li><strong>Datenschutz:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">https://policies.google.com/privacy</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">5.7 Andere Nutzer der Plattform</h3>
                    <p className="mb-2">
                      Bei Annahme einer Offerte werden vollständige Kontaktdaten (Name, Telefonnummer, E-Mail-Adresse, 
                      Projektadresse) zwischen Auftraggeber und Handwerker ausgetauscht. Dies ist für die Vertragsabwicklung 
                      erforderlich.
                    </p>
                    <p className="mb-2">
                      Bewertungen werden nach Abschluss eines Auftrags öffentlich auf der Plattform angezeigt. 
                      Dabei wird aus Datenschutzgründen ausschliesslich der Vorname des Auftraggebers verwendet. 
                      Handwerker können öffentlich auf Bewertungen antworten.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Internationale Datentransfers</h2>
                <p className="text-ink-700 mb-4">
                  Einige unserer Dienstleister sind in Ländern ausserhalb der Schweiz und des Europäischen Wirtschaftsraums 
                  (EWR) ansässig. In solchen Fällen stellen wir durch geeignete Massnahmen sicher, dass ein angemessenes 
                  Datenschutzniveau gewährleistet ist:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>EU-Standardvertragsklauseln (SCC) für Transfers in Drittländer</li>
                  <li>Angemessenheitsbeschlüsse der EU-Kommission bzw. des Bundesrats</li>
                  <li>Zertifizierungen und Binding Corporate Rules der Dienstleister</li>
                </ul>
                <p className="text-ink-700 mt-4 mb-2"><strong>Betroffene Länder und Schutzmechanismen:</strong></p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li><strong>Deutschland</strong> (Supabase/AWS) – EU-Angemessenheitsbeschluss, DSGVO-konform</li>
                  <li><strong>Schweiz</strong> (Payrexx) – kein Transfer ins Ausland</li>
                  <li><strong>Neuseeland</strong> (SMTP2GO) – Angemessenheitsbeschluss des Bundesrats</li>
                  <li><strong>USA</strong> (Google Analytics, Google Tag Manager) – EU-Standardvertragsklauseln (SCC) sowie Angemessenheitsentscheid gemäss Swiss-U.S. Data Privacy Framework</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Speicherdauer</h2>
                <div className="text-ink-700 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">7.1 Aktive Nutzerkonten</h3>
                    <p>Daten werden gespeichert, solange das Nutzerkonto aktiv ist.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">7.2 Nach Kontolöschung</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Personenbezogene Daten: Gelöscht nach 30 Tagen (Widerrufsfrist)</li>
                      <li>Bewertungsdaten: Bewertungen und Antworten bleiben anonymisiert bestehen, um die Integrität des Bewertungssystems zu gewährleisten; der Vorname wird durch einen Platzhalter ersetzt</li>
                      <li>Kommunikationsdaten: Anonymisiert nach 90 Tagen</li>
                      <li>Transaktionsdaten: Aufbewahrung für 10 Jahre (gesetzliche Aufbewahrungspflicht OR Art. 958f)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">7.3 Log-Daten und Analytics</h3>
                    <p>Technische Logs und anonymisierte Nutzungsdaten: 24 Monate</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">7.4 Cookie-Daten</h3>
                    <p>Siehe Abschnitt 9 (Cookie-Richtlinie)</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Ihre Rechte</h2>
                <p className="text-ink-700 mb-4">
                  Gemäss dem revidierten Schweizer Datenschutzgesetz (nDSG) und der DSGVO haben Sie folgende Rechte:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li><strong>Auskunftsrecht (Art. 25 nDSG / Art. 15 DSGVO):</strong> Sie können Auskunft über die von uns 
                  verarbeiteten Daten verlangen.</li>
                  <li><strong>Recht auf Berichtigung (Art. 6 Abs. 5 nDSG / Art. 16 DSGVO):</strong> Sie können die Korrektur 
                  falscher Daten verlangen.</li>
                  <li><strong>Recht auf Löschung (Art. 6 Abs. 5 nDSG / Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer 
                  Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</li>
                  <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung 
                  der Verarbeitung verlangen.</li>
                  <li><strong>Recht auf Datenübertragbarkeit (Art. 28 nDSG / Art. 20 DSGVO):</strong> Sie können Ihre Daten 
                  in einem strukturierten, gängigen Format erhalten.</li>
                  <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer 
                  Daten aus Gründen Ihrer besonderen Situation widersprechen.</li>
                  <li><strong>Widerruf der Einwilligung:</strong> Sie können erteilte Einwilligungen jederzeit mit Wirkung 
                  für die Zukunft widerrufen.</li>
                </ul>
                <p className="text-ink-700 mt-4">
                  Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter:{' '}
                  <a href="mailto:info@bueeze.ch" className="text-brand-500 hover:text-brand-600">
                    info@bueeze.ch
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Cookie-Richtlinie</h2>
                <div className="text-ink-700 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">9.1 Was sind Cookies?</h3>
                    <p>
                      Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und die Ihr Browser speichert. 
                      Sie ermöglichen es uns, bestimmte Informationen zu speichern.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">9.2 Verwendete Cookie-Kategorien</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Essenziell (immer aktiv):</strong>
                        <ul className="list-circle pl-6 mt-1">
                          <li>Session-Cookies zur Authentifizierung</li>
                          <li>Cookie-Consent-Speicherung</li>
                          <li>Sicherheits-Cookies (CSRF-Schutz)</li>
                          <li><strong>Speicherdauer:</strong> Session oder 12 Monate</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Analyse-Cookies (mit Einwilligung):</strong>
                        <ul className="list-circle pl-6 mt-1">
                          <li>Google Analytics (_ga, _gid, _gat)</li>
                          <li>Google Tag Manager</li>
                          <li><strong>Speicherdauer:</strong> Bis zu 24 Monate</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Marketing-Cookies (mit Einwilligung):</strong>
                        <ul className="list-circle pl-6 mt-1">
                          <li>Derzeit nicht verwendet</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">9.3 Cookie-Verwaltung</h3>
                    <p>
                      Sie können Ihre Cookie-Einstellungen jederzeit ändern. Die meisten Browser akzeptieren Cookies 
                      automatisch. Sie können Ihren Browser so einstellen, dass er Cookies ablehnt oder Sie benachrichtigt, 
                      wenn Cookies gesendet werden. Bitte beachten Sie, dass einige Funktionen der Website möglicherweise 
                      nicht verfügbar sind, wenn Sie Cookies deaktivieren.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Datensicherheit</h2>
                <p className="text-ink-700 mb-4">
                  Wir treffen geeignete technische und organisatorische Sicherheitsmassnahmen, um Ihre Daten vor Verlust, 
                  Zerstörung, Manipulation und unberechtigtem Zugriff zu schützen:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Sämtliche Kommunikation und Datenübertragungen zwischen Ihrem Endgerät und unseren Servern erfolgen ausschliesslich über hochgesicherte, verschlüsselte Kanäle (TLS 1.2+/TLS 1.3)</li>
                  <li>Verschlüsselte Speicherung sensibler Daten (AES-256 at rest)</li>
                  <li>Ende-zu-Ende verschlüsselte Verbindungen zu allen eingebundenen Drittanbietern</li>
                  <li>Zugriffsbeschränkungen und Authentifizierung</li>
                  <li>Regelmässige Sicherheits-Audits</li>
                  <li>Backup-Systeme</li>
                  <li>Mitarbeiterschulungen zum Datenschutz</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">11. Beschwerderecht</h2>
                <p className="text-ink-700 mb-4">
                  Sie haben das Recht, eine Beschwerde bei der zuständigen Datenschutz-Aufsichtsbehörde einzureichen:
                </p>
                <div className="text-ink-700 space-y-2">
                  <p><strong>Schweiz:</strong></p>
                  <p>
                    Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)<br />
                    Feldeggweg 1<br />
                    3003 Bern<br />
                    Schweiz
                  </p>
                  <p>
                    Website:{' '}
                    <a 
                      href="https://www.edoeb.admin.ch" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600"
                    >
                      www.edoeb.admin.ch
                    </a>
                  </p>
                  <p className="mt-4"><strong>EU/EWR:</strong></p>
                  <p>Ihre zuständige Datenschutzbehörde im jeweiligen Land</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">12. Änderungen der Datenschutzerklärung</h2>
                <p className="text-ink-700">
                  Wir behalten uns das Recht vor, diese Datenschutzerklärung jederzeit unter Beachtung der geltenden 
                  Datenschutzvorschriften zu ändern. Die aktuelle Version ist stets auf unserer Website verfügbar. 
                  Bei wesentlichen Änderungen werden wir Sie per E-Mail oder durch einen deutlichen Hinweis auf unserer 
                  Website informieren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">13. Kontakt</h2>
                <p className="text-ink-700 mb-4">
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte:
                </p>
                <div className="text-ink-700 space-y-2">
                  <p><strong>{b.company_legal_name}</strong></p>
                  <p>Datenschutz</p>
                  <p>{b.company_street}<br />{b.company_zip} {b.company_city}<br />{b.company_country}</p>
                  <p>
                    E-Mail:{' '}
                    <a href={`mailto:${b.company_email}`} className="text-brand-500 hover:text-brand-600">
                      {b.company_email}
                    </a>
                  </p>
                  <p>
                    Telefon:{' '}
                    <a href={`tel:${b.company_phone.replace(/\s/g, '')}`} className="text-brand-500 hover:text-brand-600">
                      {b.company_phone}
                    </a>
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
