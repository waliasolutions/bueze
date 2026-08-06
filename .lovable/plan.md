# Übersichtliches Fehlerlog (Upload- und Speicherfehler nachvollziehen)

## Ziel
Wenn ein Handwerker künftig meldet «Upload klappt nicht», sollen wir im Admin-Bereich in wenigen Sekunden sehen: wer, wann, welche Aktion, welche Fehlermeldung, welches Gerät, wie gross die Datei war. Heute gibt es dafür nur Browser-Konsole und Sentry (nur produktiv, nur mit DSN) — also keine Historie im Produkt.

## Vorgehen (SSOT, kein Parallelsystem)
Bestehende Bausteine werden erweitert, nichts Neues daneben gebaut:

- `src/lib/errorTracking.ts` bleibt der einzige Eintrittspunkt (`captureException`). Er schreibt zusätzlich in die neue Tabelle — alle bereits vorhandenen Aufrufe (Upload, Fetch-Retries, ErrorBoundary) landen damit automatisch im Log, ohne dass Aufrufstellen angepasst werden.
- Kategorisierung und deutsche Klartext-Erklärung kommen weiterhin aus `src/lib/errorCategories.ts` (`categorizeError`), damit Log und UI-Meldung identisch benannt sind.

## Was der Admin sieht
Neue Seite unter «Admin → Fehlerlog»:
- Tabelle, neueste zuerst: Zeitpunkt (Europe/Zurich), Benutzer (Name/E-Mail), Kontext (z. B. «Logo-Upload»), Kategorie, Schweregrad, Kurzmeldung.
- Zeile aufklappbar: technische Originalmeldung, Dateigrösse/-typ, Browser/Gerät, Route, Korrelations-ID.
- Filter: Kategorie, Schweregrad, Zeitraum (24 h / 7 T / 30 T), Freitextsuche über E-Mail und Meldung.
- Kleine Kopfzeile mit Anzahl Fehler pro Kategorie im gewählten Zeitraum, damit Häufungen sofort auffallen.

## Datenschutz und Hygiene
- Nur Admins dürfen lesen (`has_role(auth.uid(),'admin'/'super_admin')`), niemand darf ändern oder löschen.
- Eingeloggte und Gäste dürfen einfügen (Fehler passieren auch vor dem Login) — aber nur die eigene `user_id`.
- Keine Dateiinhalte, keine Tokens, keine Passwörter; nur Metadaten. Bekannte sensible Schlüssel werden vor dem Schreiben aus dem Kontext entfernt.
- Aufbewahrung 90 Tage, Aufräumen über die bestehende `run_retention_cleanup()`-Funktion (kein neuer Cron-Job).

## Technische Details
1. Migration: Tabelle `public.app_error_log` mit `id`, `created_at`, `user_id`, `user_email`, `context` (z. B. `uploadHandwerkerImage`), `category`, `severity`, `message`, `detail`, `route`, `user_agent`, `correlation_id`, `metadata jsonb`. Danach in derselben Migration: `GRANT INSERT TO anon, authenticated`, `GRANT SELECT TO authenticated`, `GRANT ALL TO service_role`, RLS aktivieren, Policies (Insert für alle, Select nur Admin, kein Update/Delete). Index auf `(created_at DESC)` und `(category, created_at DESC)`. `run_retention_cleanup()` um Löschung >90 Tage erweitern.
2. `src/lib/errorTracking.ts`: `captureException` schreibt zusätzlich per Fire-and-forget-Insert (Fehler beim Loggen dürfen nie die App stören), inkl. `categorizeError`-Ergebnis, Route, `navigator.userAgent`, Korrelations-ID und bereinigtem Kontext.
3. `src/lib/fileUpload.ts`: bestehende `captureException`-Aufrufe erhalten `originalSize`, `processedSize`, `mimeType`, `bucket` im Kontext — mehr braucht es für Upload-Diagnose nicht.
4. Neue Seite `src/pages/admin/ErrorLog.tsx` (Muster von `AdminLeadsManagement.tsx`: Card, Table, Select-Filter, Skeleton), Route `errors` in `src/App.tsx`, Eintrag in `src/components/admin/AdminSidebar.tsx`. Zeitanzeige über `src/lib/swissTime.ts`.

## Nicht Teil davon
Keine E-Mail-Alarme, kein Dashboard mit Charts, kein Ersatz für Sentry — nur ein lesbares Log im Admin-Bereich.
