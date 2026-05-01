## Plan: Quick-Action „Passwort zurücksetzen" in Handwerker-Management

### Ziel
Admin kann direkt aus `/admin/handwerker` (Aktionsspalte jeder Zeile) das Passwort eines Handwerkers zurücksetzen — gleicher Dialog, gleiche Logik, gleiches Edge-Function wie in `/admin/users`. Kein zweites System.

### SSOT-Strategie
Heute lebt der Reset-Dialog inline in `src/pages/admin/UserManagement.tsx` (Modus-Toggle Support-Passwort / eigenes Passwort, Validierung, Anzeige + Copy, Edge-Function-Call). Damit Handwerker-Management denselben Dialog nutzt **ohne Code-Duplizierung**, wird der Dialog in eine wiederverwendbare Komponente extrahiert.

### Änderungen

**1. Neue Komponente** `src/components/admin/PasswordResetDialog.tsx`
- Props: `open`, `onOpenChange`, `userId`, `userEmail`, `userName`
- Enthält 1:1 die heute in `UserManagement.tsx` lebende Logik:
  - Modus-Toggle „Support-Passwort" / „Eigenes Passwort"
  - Eingabe + Bestätigungsfeld, Validierung via `validatePassword()` aus `src/lib/validationHelpers.ts`
  - Aufruf von `supabase.functions.invoke('reset-user-password', { body: { userId, userEmail, userName, customPassword, notifyUsers: false } })`
  - Erfolg: Passwort + Copy-Button + Eye-Toggle anzeigen
  - Toasts für Fehler/Erfolg (de-CH)
- Keine neue Edge-Function, keine neuen Konstanten — `SUPPORT_PASSWORD` bleibt im Modul (oder wird nach `src/config/siteConfig.ts` verschoben, falls dort sinnvoller).

**2. `src/pages/admin/UserManagement.tsx`**
- Inline-Dialog entfernen, stattdessen `<PasswordResetDialog ... />` einbinden.
- Bestehender „Passwort zurücksetzen"-Button im Dropdown öffnet die Komponente.
- Verhalten bleibt byte-genau identisch.

**3. `src/pages/admin/HandwerkerManagement.tsx`**
- In der Aktionsspalte (neben Pencil/Eye/Approve/Reject, ca. Zeile 809–820) einen neuen Icon-Button `<KeyRound>` mit Tooltip „Passwort zurücksetzen" hinzufügen, sichtbar nur wenn `h.user_id` gesetzt ist.
- Klick setzt lokalen State `resetTarget = { userId, email, name }` und öffnet `<PasswordResetDialog />`.
- Mobile: Button wird wie die anderen Icon-Buttons in der gleichen flex-Gruppe gerendert (responsive bereits vorhanden).

### Was wir explizit NICHT tun
- Keine neue Edge-Function (`reset-user-password` deckt alles ab).
- Keine zweite Validierungs- oder Passwort-Generierungslogik.
- Kein DB-Migration.
- Keine Änderung am Edge-Function-Verhalten oder an `supabase/config.toml`.
- Keine UI-Redesigns — gleicher Dialog, gleiche Buttons, gleiche Toast-Texte.

### Sicherheit (bereits durch Edge-Function abgedeckt)
- Server-side Admin-Rolle-Check (`user_roles`).
- Min-Länge serverseitig validiert.
- `signInWithPassword`-Verifikation nach Update.
- Passwort wird aus Logs/Errors via `sanitize()` entfernt.
- `notifyUsers: false` → kein E-Mail-Versand, Admin kommuniziert out-of-band.

### Akzeptanzkriterien
- In `/admin/handwerker` erscheint pro Zeile ein Schlüssel-Icon. Klick → Dialog mit Modus-Toggle.
- Eigenes Passwort (z. B. `Bueze2026!`) festlegen → Handwerker kann sich sofort einloggen.
- Verhalten in `/admin/users` ist unverändert.
- Mobile (500 px): Button bleibt in der bestehenden Aktions-Flex-Reihe sichtbar/scrollbar wie heute.

### Geänderte Dateien
- **Neu**: `src/components/admin/PasswordResetDialog.tsx`
- **Refactor**: `src/pages/admin/UserManagement.tsx` (Inline-Dialog → Komponente)
- **Edit**: `src/pages/admin/HandwerkerManagement.tsx` (Quick-Action-Button + Dialog-Einbindung)
