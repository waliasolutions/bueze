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

- Prüft, ob die Offerte `accepted` ist und der aufrufende User berechtigt (Kunde = `leads.owner_id`, Handwerker = `lead_proposals.handwerker_id`, oder Admin).
- Prüft, ob `leads.delivered_at IS NULL` (Auftrag noch nicht ausgeführt).
- Prüft, ob die Annahme nicht älter als konfigurierbare Frist (z. B. 24h) ist, falls es sich um einen Kunden-Widerruf handelt. Admin darf jederzeit.
- Setzt `lead_proposals.status = 'pending'`, `responded_at = NULL`.
- Setzt `leads.status = 'active'`, `accepted_proposal_id = NULL`, `updated_at = now()`.
- Erstellt eine Benachrichtigung für die andere Partei: «Offerte wurde zurückgezogen / Auftrag wieder offen».
- Löscht KEINE bestehende Konversation, sondern fügt ggf. einen System-Message-Hinweis hinzu.

### 3. UI: Kunden-Ansicht (`ReceivedProposals.tsx`)

- Bestätigungsdialog vor `handleAccept` und `handleReject` (AlertDialog): «Möchten Sie diese Offerte wirklich annehmen? Dieser Schritt ist nur innerhalb von 24 Stunden rückgängig machbar.»
- Bei akzeptierten Offerten (`status === 'accepted'`) wird ein neuer Button «Widerrufen» angezeigt, wenn:
  - `leads.delivered_at` noch nicht gesetzt ist,
  - die Annahme jünger als 24h ist.
- Klick auf «Widerrufen» öffnet ebenfalls einen Bestätigungsdialog und ruft `revoke_proposal_acceptance` auf.
- Nach Widerruf: UI refresht, Buttons «Annehmen/Ablehnen» erscheinen wieder.

### 4. UI: Handwerker-Ansicht

- Im Handwerker-Dashboard / Auftragsbereich wird für akzeptierte, aber noch nicht ausgeführte Aufträge ein Button «Offerte zurückziehen» / «Auftrag stornieren» eingeblendet.
- Ruft dieselbe RPC `revoke_proposal_acceptance` auf.
- Nach Widerruf: Auftrag verschwindet aus «In Bearbeitung» und erscheint wieder als potenzielle Lead-Chance (sofern noch aktiv).

### 5. Admin-Funktion

- In `AdminLeadsManagement.tsx` wird für jeden Auftrag mit akzeptierter Offerte ein Admin-Button «Annahme zurücksetzen» ergänzt, der jederzeit (auch nach 24h) widerrufen kann.

### 6. Benachrichtigungen / E-Mails

- Neue Edge-Function oder Trigger-Function `send-proposal-revocation-email` informiert die betroffene Partei.
- Keine Duplicate-E-Mails: Wird nur bei tatsächlichem Widerruf ausgelöst.

## Technische Details

- Neue DB-Funktion: `revoke_proposal_acceptance(p_proposal_id uuid) -> jsonb` (SECURITY DEFINER, search_path = public).
- Neue Edge-Function (optional): `send-proposal-revocation-email`.
- UI-Änderungen:
  - `src/components/ReceivedProposals.tsx` (Dialog + Widerruf-Button)
  - `src/pages/HandwerkerDashboard.tsx` (Stornieren-Button)
  - `src/pages/admin/AdminLeadsManagement.tsx` (Admin-Reset-Button)
- Keine Änderung am bestehenden `accept_proposal_atomic` nötig.
- SSOT: Der Widerruf nutzt denselben Zustands-Übergang wie die Annahme, nur rückwärts.

## Akzeptanzkriterien

- Kunde kann akzeptierte Offerte innerhalb 24h widerrufen, sofern Auftrag nicht ausgeführt wurde.
- Handwerker kann Auftrag stornieren, solange er nicht ausgeführt wurde.
- Admin kann jederzeit zurücksetzen.
- Vor Annahme/Ablehnung erscheint eine Rückfrage.
- Der aktuelle «Kernbohrung»-Auftrag ist nach dem Fix wieder «active» und beide Offerten sind wieder «pending».
