
## Ziel
Toast-Rauschen reduzieren. Die App feuert aktuell **~280 Toast-Aufrufe** über ~40 Dateien — viele davon bestätigen Aktionen, deren Ergebnis bereits sichtbar im UI ist (Redirect, geänderte Liste, Dialog schliesst). Solche Toasts stören besonders in der Responsive-Ansicht.

## Kriterien (SSOT für die Entscheidung)

**Behalten** — Toast ist die einzige/beste Rückmeldung:
- Alle **Fehler** (`variant: "destructive"` / `toast.error`) → immer behalten.
- **Erfolg ohne sichtbare UI-Änderung**: E-Mail versendet, Link kopiert, Passwort-Reset ausgelöst, Impersonation gestartet/beendet, Admin-Backfill-Batch fertig, Cron ausgelöst.
- **Kritische Statuswechsel mit Konsequenzen**: Angebot angenommen/abgelehnt, Zahlung erfolgreich, Lead veröffentlicht, Konto gelöscht.
- **Warnungen/Quoten**: Max. Angebote erreicht, Quota verbraucht, Session wiederhergestellt.

**Entfernen** — redundant, weil UI selbst das Ergebnis zeigt:
- „Gespeichert" / „Aktualisiert" / „Erstellt" bei Formularen, die den Datensatz direkt neu rendern oder einen Dialog schliessen (z. B. `HandwerkerEditDialog`, `HandwerkerProfileEdit` Feldspeicherungen, `GTMConfiguration`, `EditLead`).
- „Willkommen"/„Erfolgreich angemeldet" bei Login (Redirect ist Beweis genug) — bereits partiell entfernt, restliche Auth-Success-Toasts prüfen.
- „Ausgeloggt" (Redirect zur Startseite genügt).
- „Daten geladen" / „Suche abgeschlossen" (Ergebnisliste erscheint).
- Doppel-Toasts (Erfolg + darauffolgender Navigations-Toast).
- Debug-/Dev-Toasts in `TestDashboard.tsx` (nur Admin, aber prüfen ob nötig).

## Vorgehen

1. **Automatisches Klassifizierungs-Sweep** pro Datei: jeden `toast(...)`-Call einzeln kategorisieren als KEEP/REMOVE/CONVERT anhand der Kriterien oben.
2. **Betroffene Dateien** (Kandidaten mit vielen Success-Toasts):
   - `src/pages/HandwerkerProfileEdit.tsx` (~25 Toasts — viele Feldspeicherungen)
   - `src/pages/HandwerkerOnboarding.tsx` (~15)
   - `src/pages/HandwerkerDashboard.tsx` (~15)
   - `src/pages/Dashboard.tsx` (~6)
   - `src/pages/admin/UserManagement.tsx` (~12)
   - `src/pages/admin/ReviewsManagement.tsx`, `AdminInvoices.tsx`, `SEOTools.tsx`, `GTMConfiguration.tsx`
   - `src/components/ReceivedProposals.tsx`, `ReviewCard.tsx`, `PendingPlanCard.tsx`, `PaymentMethodCard.tsx`, `DocumentUploadDialog.tsx`, `admin/HandwerkerEditDialog.tsx`, `admin/PasswordResetDialog.tsx`
   - `src/pages/Auth.tsx`, `Checkout.tsx`, `EditLead.tsx`, `BrowseLeads.tsx`, `HandwerkerInvoices.tsx`, `UserDropdown.tsx`
3. **Nur Präsentationsebene** — keine Logikänderung, keine State- oder Netzwerkanpassung. Nur Toast-Aufrufe entfernen (und ggf. ungenutzte `toast`-Imports).
4. **Fehler-Toasts unangetastet lassen** — auch die stillen `console.error` bleiben wie sie sind.
5. **Verifikation**: `tsgo` Typecheck; visuelle Stichprobe via Playwright auf Login-, Profil-Save- und Angebots-Accept-Flow (kein Toast mehr sichtbar, aber UI reagiert korrekt).

## Erwartetes Ergebnis
Grobe Schätzung: **~40–60 % der Toasts entfernt** (~110–160 Aufrufe), Fehler-Toasts zu 100 % erhalten. Deutliche Reduktion visueller Ablenkung, keine Verhaltensänderung, kein Datenverlust, kein Sicherheits-Impact.

## Nicht im Scope
- Kein Umbau des Toast-Systems (sonner vs. legacy) — bestehender Mix bleibt bis zu einem separaten SSOT-Konsolidierungs-Task.
- Keine Copy-Änderungen an behaltenen Toasts.
- Keine Änderungen an Edge-Function-Responses.
