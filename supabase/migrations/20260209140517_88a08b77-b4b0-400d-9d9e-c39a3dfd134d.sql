
-- Seed homepage_how_it_works content
INSERT INTO public.page_content (page_key, content_type, status, fields, seo)
VALUES (
  'homepage_how_it_works',
  'homepage',
  'published',
  jsonb_build_object(
    'title', 'So einfach funktioniert es',
    'subtitle', 'In drei simplen Schritten zum perfekten Handwerker',
    'steps', jsonb_build_array(
      jsonb_build_object('title', 'Projekt beschreiben', 'description', 'Beschreiben Sie, wobei Sie Hilfe brauchen.', 'highlight', 'Kostenlos & unverbindlich.'),
      jsonb_build_object('title', 'Offerten erhalten', 'description', 'Geprüfte Handwerker senden Ihnen Offerten. Ihre Kontaktdaten bleiben geschützt.', 'highlight', ''),
      jsonb_build_object('title', 'Handwerker auswählen', 'description', 'Vergleichen Sie Offerten und wählen Sie den besten Anbieter. Erst nach Ihrer Zusage werden Kontaktdaten ausgetauscht.', 'highlight', '')
    )
  ),
  NULL
);

-- Seed homepage_footer content
INSERT INTO public.page_content (page_key, content_type, status, fields, seo)
VALUES (
  'homepage_footer',
  'homepage',
  'published',
  jsonb_build_object(
    'companyDescription', 'Die Plattform für Handwerker-Vermittlung in der Schweiz. Verbinden Sie sich mit geprüften Profis für Ihr nächstes Projekt.',
    'email', 'info@bueeze.ch',
    'phone', '+41 41 558 22 33',
    'address', 'Industriestrasse 28, 9487 Gamprin-Bendern',
    'socialLinks', jsonb_build_object('facebook', 'https://m.facebook.com/profile.php?id=61582960604117', 'instagram', 'https://www.instagram.com/bueeze.ch/'),
    'quickLinks', jsonb_build_array(
      jsonb_build_object('label', 'Für Auftraggeber', 'href', '/submit-lead'),
      jsonb_build_object('label', 'Für Handwerker', 'href', '/handwerker'),
      jsonb_build_object('label', 'Preise', 'href', '/pricing'),
      jsonb_build_object('label', 'AGB', 'href', '/legal/agb'),
      jsonb_build_object('label', 'Impressum', 'href', '/impressum'),
      jsonb_build_object('label', 'Datenschutz', 'href', '/datenschutz')
    )
  ),
  NULL
);

-- Seed homepage_faq content (using E'' strings for special chars)
INSERT INTO public.page_content (page_key, content_type, status, fields, seo)
VALUES (
  'homepage_faq',
  'homepage',
  'published',
  jsonb_build_object(
    'title', 'Häufig gestellte Fragen',
    'subtitle', 'Alles, was Sie über Büeze.ch wissen müssen',
    'categories', jsonb_build_array(
      jsonb_build_object('category', 'Anfrage erstellen', 'questions', jsonb_build_array(
        jsonb_build_object('q', 'Was gehört in eine gute Handwerker-Anfrage?', 'a', 'Damit Handwerker eine faire und präzise Offerte erstellen können, sollte Ihre Anfrage Ihr Projekt so klar wie möglich beschreiben. Geben Sie an, was gemacht werden soll, bis wann, und - wenn möglich - fügen Sie Fotos oder Pläne hinzu. Auch eine grobe Budgetvorstellung hilft den Handwerkern, Ihnen passende Angebote zu senden. Je genauer Ihre Angaben, desto reibungsloser verläuft der Ablauf.'),
        jsonb_build_object('q', 'Wie prüft Büeze.ch meine Anfrage?', 'a', 'Bevor Ihre Anfrage online geht, wird sie von unserem Team sorgfältig geprüft. Wir achten darauf, dass alle wichtigen Informationen vorhanden sind und das Projekt in die richtige Kategorie passt. So stellen wir sicher, dass nur klare und vollständige Anfragen an die passenden Handwerker weitergeleitet werden.'),
        jsonb_build_object('q', 'Was kostet eine Anfrage bei Büeze.ch?', 'a', 'Das Erstellen einer Anfrage ist für Sie als Auftraggeber komplett kostenlos und unverbindlich. Sie zahlen nur die Kosten, die Sie direkt mit dem Handwerker für die Ausführung der Arbeit vereinbaren. Büeze.ch finanziert sich ausschliesslich über Abonnements für Handwerksbetriebe, nicht über Vermittlungsgebühren. Sie als Auftraggeber zahlen nichts - weder für die Anfrage noch für die Vermittlung.')
      )),
      jsonb_build_object('category', 'Anfrage bearbeiten oder beenden', 'questions', jsonb_build_array(
        jsonb_build_object('q', 'Wie kann ich meine Anfrage nachträglich anpassen?', 'a', 'Sie können Ihre Anfrage jederzeit über Ihr Dashboard bearbeiten. Unter "Meine Anfragen" wählen Sie einfach das gewünschte Projekt aus und klicken auf "Bearbeiten". Dort lassen sich auch zusätzliche Bilder oder Dokumente hochladen, damit Handwerker Ihr Projekt noch besser einschätzen können.'),
        jsonb_build_object('q', 'Kann ich meine Anfrage verlängern oder vorzeitig beenden?', 'a', 'Ja. Läuft Ihre Anfrage bald ab oder ist sie bereits abgelaufen, können Sie sie mit einem Klick kostenlos verlängern - so bleibt sie weiterhin für Handwerker sichtbar. Wenn Sie das Projekt nicht mehr ausschreiben möchten, können Sie Ihre Anfrage ebenfalls jederzeit über das Dashboard schliessen. Bereits eingegangene Offerten bleiben selbstverständlich erhalten.')
      )),
      jsonb_build_object('category', 'Offerten verwalten', 'questions', jsonb_build_array(
        jsonb_build_object('q', 'Wie nehme oder lehne ich eine Offerte an?', 'a', 'Wenn Ihnen eine Offerte zusagt, können Sie dem Handwerker direkt über die Nachrichtenfunktion zusagen. Wir empfehlen, die Details persönlich zu besprechen und einen schriftlichen Vertrag abzuschliessen. Falls Sie sich für ein anderes Angebot entscheiden, können Sie den Handwerkern einfach kurz und freundlich absagen - das wird geschätzt, ist aber nicht zwingend erforderlich.'),
        jsonb_build_object('q', 'Bin ich verpflichtet, über Büeze.ch einen Handwerker zu wählen?', 'a', 'Nein. Büeze.ch ist für Sie komplett unverbindlich. Sie entscheiden selbst, ob und mit wem Sie zusammenarbeiten möchten. Erst durch den direkten Vertragsabschluss mit einem Handwerker entsteht ein rechtsgültiger Auftrag.')
      )),
      jsonb_build_object('category', 'Für Handwerker', 'questions', jsonb_build_array(
        jsonb_build_object('q', 'Wie werde ich als Handwerker geprüft?', 'a', 'Nach Ihrer Registrierung prüfen wir Ihre Angaben manuell, um sicherzustellen, dass nur vertrauenswürdige und qualifizierte Fachbetriebe Zugang zu den Kundenanfragen erhalten. Diese Überprüfung dient dem Schutz unserer Auftraggeber und stärkt die Qualität auf der Plattform. In der Regel dauert sie 1-2 Werktage. Nach der Freischaltung erhalten Sie eine Bestätigungs-E-Mail und können direkt loslegen.'),
        jsonb_build_object('q', 'Wie funktioniert die Preisgestaltung für Handwerker?', 'a', 'Im kostenlosen Free-Plan sind 5 Offerten pro Monat enthalten. Mit einem Abo (Monatlich CHF 90, 6 Monate CHF 510, Jährlich CHF 960) können Sie unbegrenzt Offerten einreichen. Sobald ein Kunde Ihre Offerte akzeptiert, erhalten beide Seiten die vollständigen Kontaktdaten - ohne Zusatzkosten pro Kontakt. Sie zahlen nur für das Abo, nicht für einzelne Vermittlungen.'),
        jsonb_build_object('q', 'Was passiert, wenn der Kunde meine Offerte nicht akzeptiert?', 'a', 'Abgelehnte Offerten werden nicht auf Ihr monatliches Kontingent angerechnet. Nur eingereichte Offerten zählen zu Ihrer Limite von 5 Offerten im Free-Plan. Bei Ablehnung durch den Kunden entstehen keine zusätzlichen Kosten und Ihr Kontingent bleibt unberührt.'),
        jsonb_build_object('q', 'Welche Informationen sehen Auftraggeber von mir?', 'a', 'Ihr Profil wird erst nach der Überprüfung für passende Anfragen freigeschaltet. Ihre Kontaktdaten bleiben geschützt, bis Sie selbst den Kontakt zu einem Auftraggeber aufnehmen. So behalten Sie jederzeit die Kontrolle über Ihre Sichtbarkeit und Anfragen.'),
        jsonb_build_object('q', 'Kann ich mein Profil später anpassen?', 'a', 'Ja. In Ihrem Dashboard können Sie Ihre Angaben jederzeit aktualisieren - etwa Fachbereiche, Einsatzgebiete oder Stundensätze. So bleibt Ihr Profil immer auf dem neuesten Stand.'),
        jsonb_build_object('q', 'Muss ich auf jede Anfrage reagieren?', 'a', 'Nein. Sie entscheiden selbst, welche Projekte für Sie interessant sind - es gibt keine Verpflichtung, auf jede Anfrage zu antworten. Beachten Sie jedoch: Wenn Sie nicht zeitnah reagieren, können andere Handwerker schneller antworten und den Auftrag erhalten. Im Dashboard sehen Sie die Dringlichkeit der einzelnen Aufträge, damit Sie selbst einschätzen können, welche Projekte Sie bevorzugt bearbeiten möchten. So behalten Sie volle Flexibilität, ohne Chancen zu verpassen.')
      ))
    )
  ),
  NULL
);
