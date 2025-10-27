import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AGB = () => {
  return (
    <div className="min-h-screen bg-background">
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
                  Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform Büeze.ch. 
                  Mit der Registrierung und Nutzung unserer Dienste akzeptieren Sie diese Bedingungen vollumfänglich.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Leistungsbeschreibung</h2>
                <p className="text-ink-700 mb-4">
                  Büeze.ch ist eine Vermittlungsplattform, die Auftraggeber mit Handwerkern verbindet. 
                  Wir vermitteln lediglich Kontakte und sind nicht Vertragspartei bei den entstehenden Aufträgen.
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Für Auftraggeber: Kostenlose Erstellung und Veröffentlichung von Anfragen</li>
                  <li>Für Handwerker: Zugang zu Aufträgen nach manueller Verifizierung</li>
                  <li>Vermittlung von Kontaktdaten nach Kauf eines Leads</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Registrierung und Verifizierung</h2>
                <p className="text-ink-700 mb-4">
                  <strong>Für Auftraggeber:</strong> Die Registrierung ist kostenlos und ohne Verifizierung möglich.
                </p>
                <p className="text-ink-700 mb-4">
                  <strong>Für Handwerker:</strong> Nach der Registrierung erfolgt eine manuelle Überprüfung durch unser Team. 
                  Erst nach erfolgreicher Verifizierung erhalten Sie Zugang zu Kundenanfragen. 
                  Die Verifizierung dauert in der Regel 1-2 Werktage.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Preise und Zahlungsbedingungen</h2>
                <p className="text-ink-700 mb-4">
                  <strong>Für Auftraggeber:</strong> Die Nutzung der Plattform ist vollständig kostenlos.
                </p>
                <p className="text-ink-700 mb-4">
                  <strong>Für Handwerker:</strong>
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Die Registrierung ist kostenlos</li>
                  <li>Nach der Freischaltung können erste Leads eingesehen werden</li>
                  <li>Für den vollständigen Zugang zu Kundendaten kann ein Abo abgeschlossen werden</li>
                  <li>Alle Preise werden transparent im Dashboard angezeigt</li>
                  <li>Zahlungen erfolgen im Voraus per Kreditkarte oder anderen verfügbaren Zahlungsmitteln</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Datenschutz</h2>
                <p className="text-ink-700 mb-4">
                  Der Schutz Ihrer Daten ist uns wichtig. Alle Daten werden gemäss schweizerischem Datenschutzrecht behandelt.
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Kontaktdaten von Auftraggebern werden nur an verifizierte Handwerker weitergegeben</li>
                  <li>Handwerker-Kontaktdaten bleiben geschützt, bis sie selbst Kontakt aufnehmen</li>
                  <li>Alle Anfragen werden vor Veröffentlichung geprüft</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Haftung und Gewährleistung</h2>
                <p className="text-ink-700 mb-4">
                  Büeze.ch haftet nicht für:
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-2">
                  <li>Die Qualität der ausgeführten Handwerkerleistungen</li>
                  <li>Vertragliche Vereinbarungen zwischen Auftraggebern und Handwerkern</li>
                  <li>Schäden, die durch die Nutzung der Plattform entstehen</li>
                  <li>Die Richtigkeit der von Nutzern bereitgestellten Informationen</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Kündigung und Sperrung</h2>
                <p className="text-ink-700 mb-4">
                  Nutzer können ihr Konto jederzeit über das Dashboard löschen. 
                  Büeze.ch behält sich das Recht vor, Konten bei Verstoss gegen diese AGB zu sperren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Änderungen der AGB</h2>
                <p className="text-ink-700 mb-4">
                  Wir behalten uns das Recht vor, diese AGB jederzeit zu ändern. 
                  Registrierte Nutzer werden über wesentliche Änderungen per E-Mail informiert.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Anwendbares Recht und Gerichtsstand</h2>
                <p className="text-ink-700 mb-4">
                  Es gilt schweizerisches Recht. Gerichtsstand ist der Sitz von Büeze.ch.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Kontakt</h2>
                <p className="text-ink-700 mb-4">
                  Bei Fragen zu diesen AGB kontaktieren Sie uns bitte über das Kontaktformular auf unserer Website.
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
