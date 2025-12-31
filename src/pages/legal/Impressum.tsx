import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title="Impressum | Büeze.ch"
        description="Impressum und rechtliche Informationen zur Büeze GmbH, dem Betreiber der Handwerker-Vermittlungsplattform Büeze.ch."
        canonical="https://bueeze.ch/impressum"
        robotsMeta="index,follow"
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Impressum</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Angaben gemäss Art. 3 UWG</h2>
                <div className="text-ink-700 space-y-2">
                  <p><strong>Büeze GmbH</strong></p>
                  <p>Gotthardstrasse 37<br />6410 Goldau<br />Schweiz</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
                <div className="text-ink-700 space-y-2">
                  <p>
                    <strong>E-Mail:</strong>{' '}
                    <a href="mailto:info@bueeze.ch" className="text-brand-500 hover:text-brand-600">
                      info@bueeze.ch
                    </a>
                  </p>
                  <p>
                    <strong>Telefon:</strong>{' '}
                    <a href="tel:+41415582233" className="text-brand-500 hover:text-brand-600">
                      +41 41 558 22 33
                    </a>
                  </p>
                  <p>
                    <strong>Website:</strong>{' '}
                    <a href="https://bueeze.ch" className="text-brand-500 hover:text-brand-600">
                      www.bueeze.ch
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Handelsregister</h2>
                <div className="text-ink-700 space-y-2">
                  <p><strong>Rechtsform:</strong> Gesellschaft mit beschränkter Haftung (GmbH)</p>
                  <p><strong>Handelsregistereintrag:</strong> Im Handelsregister eingetragen</p>
                  <p><strong>Handelsregister:</strong> Kanton Schwyz</p>
                  <p><strong>UID:</strong> CHE-389.446.099</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Vertretungsberechtigte Personen</h2>
                <div className="text-ink-700">
                  <p><strong>Geschäftsführung:</strong> MHS Haustechnik GmbH</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Inhaltlich Verantwortliche</h2>
                <div className="text-ink-700">
                  <p>Verantwortlich für den Inhalt gemäss Art. 3 Abs. 1 UWG:</p>
                  <p>Büeze GmbH, vertreten durch die Geschäftsführung</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Haftungsausschluss</h2>
                <div className="text-ink-700 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Inhalt des Onlineangebotes</h3>
                    <p>
                      Der Autor übernimmt keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität 
                      der bereitgestellten Informationen. Haftungsansprüche gegen den Autor, welche sich auf Schäden 
                      materieller oder ideeller Art beziehen, die durch die Nutzung oder Nichtnutzung der dargebotenen 
                      Informationen bzw. durch die Nutzung fehlerhafter und unvollständiger Informationen verursacht wurden, 
                      sind grundsätzlich ausgeschlossen, sofern seitens des Autors kein nachweislich vorsätzliches oder grob 
                      fahrlässiges Verschulden vorliegt.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verweise und Links</h3>
                    <p>
                      Bei direkten oder indirekten Verweisen auf fremde Webseiten ("Hyperlinks"), die ausserhalb des 
                      Verantwortungsbereiches des Autors liegen, würde eine Haftungsverpflichtung ausschliesslich in dem 
                      Fall in Kraft treten, in dem der Autor von den Inhalten Kenntnis hat und es ihm technisch möglich und 
                      zumutbar wäre, die Nutzung im Falle rechtswidriger Inhalte zu verhindern.
                    </p>
                    <p className="mt-2">
                      Der Autor erklärt hiermit ausdrücklich, dass zum Zeitpunkt der Linksetzung keine illegalen Inhalte 
                      auf den zu verlinkenden Seiten erkennbar waren. Auf die aktuelle und zukünftige Gestaltung, die Inhalte 
                      oder die Urheberschaft der verlinkten/verknüpften Seiten hat der Autor keinerlei Einfluss. Deshalb 
                      distanziert er sich hiermit ausdrücklich von allen Inhalten aller verlinkten/verknüpften Seiten, die 
                      nach der Linksetzung verändert wurden.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Urheber- und Kennzeichenrecht</h3>
                    <p>
                      Der Autor ist bestrebt, in allen Publikationen die Urheberrechte der verwendeten Bilder, Grafiken, 
                      Tondokumente, Videosequenzen und Texte zu beachten, von ihm selbst erstellte Bilder, Grafiken, 
                      Tondokumente, Videosequenzen und Texte zu nutzen oder auf lizenzfreie Grafiken, Tondokumente, 
                      Videosequenzen und Texte zurückzugreifen.
                    </p>
                    <p className="mt-2">
                      Alle innerhalb des Internetangebotes genannten und ggf. durch Dritte geschützten Marken- und 
                      Warenzeichen unterliegen uneingeschränkt den Bestimmungen des jeweils gültigen Kennzeichenrechts und 
                      den Besitzrechten der jeweiligen eingetragenen Eigentümer.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Datenschutz</h3>
                    <p>
                      Sofern innerhalb des Internetangebotes die Möglichkeit zur Eingabe persönlicher oder geschäftlicher 
                      Daten (E-Mail-Adressen, Namen, Anschriften) besteht, so erfolgt die Preisgabe dieser Daten seitens 
                      des Nutzers auf ausdrücklich freiwilliger Basis. Die Inanspruchnahme und Bezahlung aller angebotenen 
                      Dienste ist – soweit technisch möglich und zumutbar – auch ohne Angabe solcher Daten bzw. unter Angabe 
                      anonymisierter Daten oder eines Pseudonyms gestattet.
                    </p>
                    <p className="mt-2">
                      Weitere Informationen finden Sie in unserer{' '}
                      <Link to="/datenschutz" className="text-brand-500 hover:text-brand-600">
                        Datenschutzerklärung
                      </Link>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Rechtswirksamkeit</h3>
                    <p>
                      Dieser Haftungsausschluss ist als Teil des Internetangebotes zu betrachten, von dem aus auf diese 
                      Seite verwiesen wurde. Sofern Teile oder einzelne Formulierungen dieses Textes der geltenden 
                      Rechtslage nicht, nicht mehr oder nicht vollständig entsprechen sollten, bleiben die übrigen Teile 
                      des Dokumentes in ihrem Inhalt und ihrer Gültigkeit davon unberührt.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Streitbeilegung</h2>
                <div className="text-ink-700 space-y-2">
                  <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                    <a 
                      href="https://ec.europa.eu/consumers/odr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600"
                    >
                      https://ec.europa.eu/consumers/odr
                    </a>
                  </p>
                  <p>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                    Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Anwendbares Recht</h2>
                <div className="text-ink-700">
                  <p>
                    Auf alle Rechtsbeziehungen zwischen Büeze GmbH und seinen Nutzern findet ausschliesslich Schweizer Recht 
                    Anwendung unter Ausschluss der Bestimmungen des UN-Kaufrechts.
                  </p>
                  <p className="mt-2">
                    <strong>Gerichtsstand:</strong> Bei Streitigkeiten aus der Nutzung dieser Website gilt als Gerichtsstand 
                    Schwyz, Schweiz.
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

export default Impressum;
