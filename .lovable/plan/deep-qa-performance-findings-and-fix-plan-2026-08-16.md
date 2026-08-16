# Deep QA: Performance — Findings and Fix Plan

Measured against live data (pg_stat_statements + code reads). Important context: all tables are tiny (53 leads, 641 Handwerker-Profile, 732 Profile). So **no query is slow because of missing indexes** — the cost comes from *how much* is fetched and *how often*. Adding indexes here would not help.

## What is actually costing time

| Where | Evidence | Problem |
|---|---|---|
| Aktive Leads laden (HandwerkerDashboard, Zeile 287) | 4.939 Aufrufe, 12,6 ms Ø, 62 s total, `select('*')` auf `leads` mit `status = active`, ohne Limit | Lädt alle Spalten (Beschreibung, `media_urls`, `search_text`-Nachbarn) für jede Ansicht |
| Handwerker-Liste (Admin) | 3.737 Aufrufe, 44 s total, `handwerker_profiles.*` ohne Filter, ohne Limit | Volle Zeilen inkl. Bank-/Versicherungsfelder für eine Listenansicht |
| Offerten des Handwerkers | 2.291 Aufrufe, 16,4 ms Ø, `lead_proposals.*` + Lead-Join | Volle Zeilen statt Projektion |
| Abos | 2.859 Aufrufe auf `handwerker_subscriptions` **ohne** `user_id`-Filter | Ganze Tabelle wird geladen und im Client gefiltert |
| Rollen | `user_roles` nach `user_id`: **93.550** Aufrufe | Sehr hohe Aufrufzahl trotz Rollen-Cache — Ursache noch nicht bestätigt |
| CMS-Inhalte | `page_content` nach `page_key`: **64.304** Aufrufe | Sehr hohe Aufrufzahl trotz 5-Minuten-Cache — Ursache noch nicht bestätigt |
| Benachrichtigungen | 15.900 Aufrufe auf `admin_notifications` | Dropdown lädt bei jedem Mount/Realtime-Event neu, ohne React-Query-Cache |
| HandwerkerDashboard (1.905 Zeilen) | 5 imperative `useEffect`-Ketten mit `await`-Folgen | Wasserfall-Ladezeiten, kein Cache → bei jedem Seitenwechsel alles neu |

## Fix plan (in dieser Reihenfolge)

### 1. Spalten-Projektion statt `select('*')` (grösster Effekt, kein Risiko)
- `leads` (aktive Liste), `handwerker_profiles` (Admin-Liste), `lead_proposals` (Dashboard) auf die tatsächlich gerenderten Felder reduzieren.
- Detailansichten laden weiterhin die vollen Zeilen — nur Listen werden schlank.
- Erwartung: deutlich kleinere Antworten (Beschreibungen/Media-Arrays fallen aus Listen weg), gleiche UI.

### 2. Abo-Abfrage filtern
- `handwerker_subscriptions` immer mit `.eq('user_id', …)` bzw. beim Admin gezielt per `in(user_id, …)` laden — nie die ganze Tabelle.

### 3. Wasserfälle im HandwerkerDashboard auflösen
- Unabhängige Fetches in `Promise.all` bündeln (Profil, Abo, Leads, Offerten, Benachrichtigungen) statt sequenziell.
- Keine Logik-, Text- oder Layout-Änderungen.

### 4. Benachrichtigungen über React Query cachen
- `notification-dropdown` auf `useQuery` mit `staleTime` umstellen, Realtime-Events invalidieren nur den Cache-Key statt direkt neu zu laden. Ein Fetch pro Nutzer statt einer pro Mount.

### 5. Aufrufzahlen von `user_roles` und `page_content` untersuchen (Diagnose zuerst)
- Ursache ist **nicht bestätigt**. Erster Schritt: pro Route zählen, wie oft die Hooks feuern (kurzzeitiges Zähl-Logging in Dev), dann gezielt fixen — z. B. gemeinsamer Query-Key, Provider-Ebene statt Komponenten-Ebene.
- Kein Blindfix, bevor die Messung vorliegt.

## Ausdrücklich nicht gemacht
- **Keine neuen Indizes** — bei 53 Leads / 641 Profilen bringen sie nichts und verteuern nur Writes.
- Keine Umgestaltung von UI, Texten oder Workflows.
- Keine neuen Bibliotheken, keine parallelen Datenschichten (SSOT bleibt bestehen).

## Technische Details
- Betroffene Dateien: `src/pages/HandwerkerDashboard.tsx`, `src/pages/admin/HandwerkerManagement.tsx`, `src/components/ui/notification-dropdown.tsx`, `src/hooks/useSubscription.ts`, ggf. `src/hooks/useUserRole.ts` / `src/hooks/usePageContent.ts` (nur nach Messung).
- Der Overflow-Detector in `src/App.tsx` ist über `import.meta.env.DEV` sauber ausgeschlossen und in Produktion kostenlos — bleibt unverändert.
- Route-Splitting ist bereits vorhanden (51 `lazy()`-Imports) — keine Änderung nötig.
