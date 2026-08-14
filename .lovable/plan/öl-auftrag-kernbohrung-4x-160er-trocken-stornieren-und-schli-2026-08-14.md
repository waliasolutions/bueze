# öl Auftrag «Kernbohrung 4x 160er Trocken» stornieren und schliessen

## Ausgangslage (geprüft)

- Auftrag: «Kernbohrung 4x 160er Trocken», Kunde Manuel Erdmann ([manoloerdmann@gmail.com](mailto:manoloerdmann@gmail.com)), Status aktuell `active`.
- Offerte, die angenommen war: Helvetic Bau Service Farzat Al Housein ([helveticbauservice@gmail.com](mailto:helveticbauservice@gmail.com)) — steht nach dem Storno wieder auf `offen`.
- Zweite Offerte (ENIR Kida GmbH) ist bereits `abgelehnt` — bleibt unverändert, erhält keine Mail.

## Was gemacht wird

1. **Auftrag schliessen**: offene Offerte auf `zurückgezogen` setzen, Auftrag auf `zurückgezogen/geschlossen` — kein Interesse mehr, keine neuen Offerten möglich.
2. **Keine automatischen Massen-Mails**: Die Statusänderung wird so ausgeführt, dass die Auftrags-Benachrichtigungen (Handwerker-Blast) nicht ausgelöst werden.
3. **Zwei Mails über SMTP2GO** im Namen von Büeze, je mit BCC an [info@walia-solutions.ch](mailto:info@walia-solutions.ch).

## Mailtext 1 — an den Kunden (Manuel Erdmann)

Betreff: Ihr Auftrag «Kernbohrung 4x 160er Trocken» wurde storniert

> Guten Tag Herr Erdmann
>
> Ihre angenommene Offerte zum Auftrag «Kernbohrung 4x 160er Trocken» wurde storniert und der Auftrag wurde zurückgezogen.
>
> Falls Sie später erneut Offerten möchten, können Sie den Auftrag jederzeit neu erfassen.
>
> Freundliche Grüsse
> Ihr Büeze-Team

## Mailtext 2 — an den Handwerker (Helvetic Bau Service)

Betreff: Auftrag «Kernbohrung 4x 160er Trocken» zurückgezogen

> Guten Tag Herr Al Housein
>
> Der Kunde hat den Auftrag «Kernbohrung 4x 160er Trocken» zurückgezogen. Es besteht kein Interesse mehr an einer Ausführung.
>
> Ihre Offerte wurde entsprechend geschlossen. Weitere Aufträge finden Sie jederzeit in Ihrem Büeze-Konto.
>
> Freundliche Grüsse
> Ihr Büeze-Team

## Technisch

- Datenänderung per SQL (Insert/Update-Tool): `lead_proposals.status = 'withdrawn'` für `bc82deab…`, `leads.status = 'deleted'` für `ebff2640…`, mit `session_replication_role = replica`, damit keine Trigger-Mails rausgehen.
- Versand über die bestehende Helper-Datei `supabase/functions/_shared/smtp2go.ts` (BCC-Support ist vorhanden) via einmalige Edge Function — Absender bleibt der bereits eingerichtete Büeze-Absender.
- Keine neuen Komponenten, kein Parallelsystem (SSOT/DRY/YAGNI).