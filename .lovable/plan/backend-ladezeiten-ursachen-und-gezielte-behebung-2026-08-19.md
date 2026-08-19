# Backend-Ladezeiten: Ursachen und gezielte Behebung

## Was die Messung zeigt

Ich habe `pg_stat_statements`, die Indizes, die RLS-Policies und die Datenmengen geprüft:

- Die Datenmengen sind winzig: 53 Leads, 12 Offerten, 642 Handwerker-Profile, 733 Profile.
- Eine einzelne Lead-Abfrage läuft in **0.15 ms** (Index `idx_leads_status_created_at` wird genutzt). Die Datenbank ist also nicht grundsätzlich langsam.
- Trotzdem liegt der Mittelwert derselben Abfrage laut Statistik bei **174 ms** und die Abfrage wurde 600–5000 Mal ausgeführt. Das ist ein Overhead-/Häufigkeitsproblem, kein Datenmengen-Problem: zu viele Requests pro Seitenaufruf, teure RLS-Auswertung pro Zeile und zu grosse Payloads.

Drei konkrete, verifizierte Ursachen:

1. **Fehlender Index auf `handwerker_profiles.user_id`.** Es existieren 9 Indizes auf dieser Tabelle, aber keiner auf `user_id` — obwohl die Leads-RLS-Policy und praktisch jedes Dashboard genau darauf filtert. Jede Prüfung liest die Tabelle komplett.
2. **Zu grosse Payloads.** 35 Stellen im Code holen `select('*')`; `handwerker_profiles` hat 47 Spalten. Die häufigste Profil-Abfrage lädt alle 642 Profile mit allen Spalten (3737 Aufrufe in der Statistik).
3. **Zu viele Einzel-Requests.** `lead_proposals`-Abfragen kamen 5137 Mal — Dashboards laden bei jedem Mount neu, ohne Cache-Nutzung, statt über React Query wiederverwendet zu werden.

## Was ich ändern werde

### 1. Indizes (Migration)
- `handwerker_profiles(user_id)` — schliesst die Lücke in RLS und allen Profil-Lookups.
- `messages(conversation_id, created_at)` und `conversations(homeowner_id)` / `conversations(handwerker_id)` — dort existiert heute nur ein Index auf `lead_id`.
- Danach `ANALYZE` auf den betroffenen Tabellen.

Keine neuen Tabellen, keine Policy-Änderungen, keine Änderung an Sichtbarkeitsregeln.

### 2. Spaltenauswahl konsolidieren (SSOT)
`src/lib/querySelects.ts` ist bereits die vorgesehene Single Source of Truth, enthält aber nur die Lead-Projektion. Ich ergänze dort die fehlenden Projektionen (Handwerker-Profil, Profil/Kontakt, Offerte) und ersetze die `select('*')`-Aufrufe in den heiss laufenden Pfaden durch diese Konstanten:
- `HandwerkerDashboard.tsx`, `Dashboard.tsx`, `BrowseLeads.tsx`, `Profile.tsx`, `Auth.tsx`, `UserDropdown.tsx`, `HandwerkerStatusIndicator.tsx`, `admin/HandwerkerManagement.tsx`.

Bewusst nicht angefasst: Admin-Detail-/Edit-Dialoge, die wirklich alle Felder brauchen, sowie Test-/Utility-Skripte (YAGNI).

### 3. Doppelte Requests entfernen
- Das Handwerker-Profil wird pro Seitenwechsel mehrfach frisch geladen (Dashboard, Header-Dropdown, Status-Indikator, Auth). Ich ziehe diesen Lookup auf einen gemeinsamen React-Query-Key mit `staleTime` (analog zum bestehenden Rollen-Cache in `useUserRole`), sodass alle Consumer denselben Cache-Eintrag nutzen — eine Quelle statt vier Abfragen.
- Keine neue Abstraktionsschicht und keine neuen RPCs: die bestehenden Muster (React Query in `App.tsx`, `queryInvalidation.ts`) werden weiterverwendet.

### 4. Verifikation
- `pg_stat_statements` zurücksetzen, Dashboard-Flows durchlaufen, danach Aufrufzahlen und Mittelwerte erneut messen und berichten.
- `EXPLAIN (ANALYZE, BUFFERS)` auf dem Profil-Lookup vor/nach dem Index.
- Sichtprüfung, dass Handwerker-, Client- und Admin-Dashboards unverändert dieselben Daten zeigen.

## Erwartetes Ergebnis
Deutlich weniger Requests pro Seitenaufruf, kleinere Antworten und Index-Zugriffe statt Full-Table-Scans in der RLS-Auswertung. Funktional und visuell ändert sich nichts.
