# Doppelversand von Mails technisch unmöglich machen

## Was passiert ist

Die einmalige Support-Function wurde mehrfach aufgerufen, bevor der neue Inhalt deployed war. Weil es keine Versandsperre gibt, hat SMTP2GO jeden Aufruf brav ausgeführt — dieselbe Mail ging 6× raus. Der Fehler war nicht der Inhalt, sondern die fehlende Absicherung: jeder Aufruf = eine Mail.

## Lösung: Versandsperre im gemeinsamen Mail-Helper (SSOT)

Alle Mails laufen bereits über eine einzige Stelle (`_shared/smtp2go.ts`). Genau dort kommt die Sperre hin, damit sie für jede heutige und zukünftige Mail gilt — nicht nur für Einmal-Mails.

1. **Versandprotokoll in der Datenbank**: neue Tabelle `email_send_log` mit eindeutigem Schlüssel (`dedupe_key`), Empfänger, Betreff, Status, Zeitstempel, SMTP2GO-ID. Nur Admins/Service-Rolle sehen sie.
2. **Sperre vor dem Versand**: wird ein `dedupeKey` mitgegeben, versucht der Helper zuerst den Eintrag zu reservieren. Existiert er schon, wird **nicht** gesendet und `{ success: true, skipped: true }` zurückgegeben. Die Eindeutigkeit in der Datenbank ist die Sperre — auch bei zwei gleichzeitigen Aufrufen gewinnt genau einer.
3. **Fallback-Schlüssel**: fehlt ein `dedupeKey`, bildet der Helper automatisch einen aus Empfänger + Betreff + Inhaltsprüfsumme und blockt identische Mails innerhalb von 10 Minuten. Damit ist ein versehentlicher Mehrfachversand auch ohne Zutun ausgeschlossen.
4. **Nachvollziehbarkeit**: jeder Versand, jede Blockade und jeder Fehlschlag steht im Protokoll; Fehlschläge zusätzlich wie bisher im Fehlerlog.

## Einmal-Mails künftig sicher

- Die Wegwerf-Function `send-support-email-once` wird ersetzt durch **`send-support-email`**: Inhalt (Empfänger, Betreff, Text) kommt als Parameter, ein `dedupeKey` ist **Pflicht**, Aufruf nur mit Admin-Anmeldung, Ausgabe immer im Büeze-CI (`emailWrapper()`).
- Ergebnis: Ein zweiter Klick oder Testlauf sendet nichts mehr, sondern meldet «bereits versendet».
- Zusätzlich: Ablauf künftig immer erst deployen, dann aufrufen — technisch aber nicht mehr nötig, weil die Sperre greift.

## Admin-Sichtbarkeit

Im bestehenden Admin-Fehlerlog-Bereich kommt ein zweiter Reiter «E-Mail-Versand» dazu: letzte Sendungen, Status, blockierte Doppelversuche. Keine neue Seite, keine neue Navigation.

## Technische Details

- Migration: `email_send_log` (unique `dedupe_key`, Indizes auf `created_at`, `recipient`), GRANTs für `service_role` (voll) und `authenticated` (SELECT), RLS: nur `has_role(auth.uid(),'admin'|'super_admin')` darf lesen.
- `supabase/functions/_shared/smtp2go.ts`: `EmailOptions.dedupeKey?`, `EmailResult.skipped?`; Reservierung per Insert vor `fetch`, Status-Update danach. Kein Verhalten bestehender Aufrufe ändert sich (nur zusätzlicher Schutz).
- Neu: `supabase/functions/send-support-email/index.ts` mit Zod-Validierung + Admin-JWT-Prüfung; `send-support-email-once` wird gelöscht.
- Frontend: nur ein Reiter in `src/pages/admin/ErrorLog.tsx`.

## Nicht enthalten (YAGNI)

Keine Mail-Warteschlange, kein Retry-Dashboard, keine Vorlagenverwaltung im Admin.
