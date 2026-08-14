# Stornieren / Annahme widerrufen

## Problem

- Kunde hat die Offerte «Kernbohrung 4x 160er Trocken» (Helvetic Bau Service, CHF 890) offenbar versehentlich angenommen (Status: `accepted`, Lead: `completed`, akzeptiert 2026-08-14 15:21 Zurich).
- Danach verschwinden im Kunden-UI die Buttons «Annehmen» / «Ablehnen» und der Kunde hat keine Möglichkeit, die Entscheidung rückgängig zu machen.
- Der Handwerker hat aktuell ebenfalls keine UI-Funktion, eine bereits akzeptierte Offerte zu stornieren.
- Es gibt keinen Bestätigungsdialog vor der Annahme/Ablehnung, was versehentliche Klicks auf Mobile begünstigt.

## Ziel

- Dieser konkrete Auftrag wird korrigiert (Annahme zurückgesetzt).
- Künftig können Kunden (und Admins) eine frische Annahme innerhalb einer kurzen Frist widerrufen.
- Handwerker können eine Akzeptanz zurückziehen, solange der Auftrag noch nicht ausgeführt wurde.
- Eine Bestätigungsdialog erschwert versehentliche Annahmen/Ablehnungen.

## Lösung

### 1. Daten-Korrektur für den aktuellen Auftrag

- `lead_proposals.status` der akzeptierten Offerte (`bc82deab-eb16-4e2a-9711-f7f1354579b7`) auf `pending` setzen.
- `leads.status` des Auftrags (`ebff2640-c7fe-45b9-bdfd-9a9b5adaca2f`) auf `active` setzen.
- `leads.accepted_proposal_id` auf `NULL` setzen.
- Bereits erstellte `conversations` und `messages` aus der Annahme belassen (History bleibt erhalten), aber ggf. als «zurückgezogen» markieren oder löschen.
- Falls bereits eine `handwerker_notifications` / `client_notifications` / E-Mail versendet wurde, ist das nicht mehr rückgängig zu machen – aber der Handwerker wird informiert, dass die Annahme zurückgezogen wurde.

### 2. Datenbank: Widerrufs-Logik

Neue SECURITY DEFINER RPC `revoke_proposal_acceptance(p_proposal_id uuid)`:

- Prüft, ob die Offerte `accepted` ist und der aufrufende User berechtigt ist: Kunde (`leads.owner_id`), Handwerker (`lead_proposals.handwerker_id`) oder Admin.
- Handwerker und Admin dürfen **immer** stornieren, ohne Zeitfenster.
- Kunde darf innerhalb von 24h nach der Annahme widerrufen.
- Setzt `lead_proposals.status = 'pending'`, `responded_at = NULL`.
- Setzt `leads.status = 'active'`, `accepted_proposal_id = NULL`, `updated_at = now()`.
- Erstellt eine Benachrichtigung für die jeweils andere Partei: «Auftrag storniert / Auftrag wieder offen».
- Löscht KEINE bestehende Konversation (History bleibt erhalten).


### 3. UI: Kunden-Ansicht (`ReceivedProposals.tsx`)

- Bestätigungsdialog vor `handleAccept` und `handleReject` (AlertDialog): «Möchten Sie diese Offerte wirklich annehmen? Dieser Schritt ist nur innerhalb von 24 Stunden rückgängig machbar.»
- Bei akzeptierten Offerten (`status === 'accepted'`) erscheint ein Button «Widerrufen», solange die Annahme jünger als 24h ist.
- Klick auf «Widerrufen» öffnet ebenfalls einen Bestätigungsdialog und ruft `revoke_proposal_acceptance` auf.
- Nach Widerruf: UI refresht, Buttons «Annehmen/Ablehnen» erscheinen wieder.

### 4. UI: Handwerker-Ansicht

- Im Handwerker-Dashboard wird bei jedem angenommenen Auftrag ein Button «Auftrag stornieren» eingeblendet – ohne Zeitlimit.
- Bestätigungsdialog mit Hinweis, dass der Auftrag danach wieder offen ist und der Kunde informiert wird.
- Ruft dieselbe RPC `revoke_proposal_acceptance` auf (SSOT).
- Nach Storno: Auftrag verschwindet aus «In Bearbeitung», Offerte ist wieder `pending`, Kunde erhält Benachrichtigung.

### 5. Admin-Funktion

- In `AdminLeadsManagement.tsx` wird für jeden Auftrag mit akzeptierter Offerte ein Admin-Button «Annahme zurücksetzen» ergänzt, der jederzeit (auch nach 24h) widerrufen kann.

### 6. Benachrichtigungen

- YAGNI: keine neue Edge-Function. Die RPC schreibt eine In-App-Benachrichtigung (`client_notifications` bzw. `handwerker_notifications`) über das bestehende Notification-Muster.

## Technische Details

- Neue DB-Funktion: `revoke_proposal_acceptance(p_proposal_id uuid) -> jsonb` (SECURITY DEFINER, search_path = public) — einzige Quelle der Storno-Logik.
- UI-Änderungen:
  - `src/components/ReceivedProposals.tsx` (Dialog + Widerruf-Button)
  - `src/pages/HandwerkerDashboard.tsx` (Stornieren-Button)
  - `src/pages/admin/AdminLeadsManagement.tsx` (Admin-Reset-Button)
- Ein gemeinsamer Helper in `src/lib/proposalHelpers.ts` kapselt den RPC-Aufruf für alle drei Oberflächen (DRY).
- Keine Änderung am bestehenden `accept_proposal_atomic` nötig.
- SSOT: Der Widerruf nutzt denselben Zustands-Übergang wie die Annahme, nur rückwärts.

## Akzeptanzkriterien

- Handwerker kann einen angenommenen Auftrag jederzeit stornieren.
- Kunde kann eine Annahme innerhalb 24h widerrufen.
- Admin kann jederzeit zurücksetzen.
- Admin kann jederzeit zurücksetzen.
- Vor Annahme/Ablehnung erscheint eine Rückfrage.
- Der aktuelle «Kernbohrung»-Auftrag ist nach dem Fix wieder «active» und beide Offerten sind wieder «pending».
