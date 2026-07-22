## Ziel
Die Erfolgs-Toast-Benachrichtigungen nach dem Login entfernen, da sie auf mobilen/ responsiven Viewports stören.

## Aktueller Stand
- `src/pages/Auth.tsx` zeigt bei erfolgreichem Standard-Login bereits keinen Toast (nur Fehler-Toasts).
- Zwei inline Login-Flows zeigen noch einen Erfolgs-Toast:
  1. `src/pages/SubmitLead.tsx` (Zeilen 390–393): "Anmeldung erfolgreich" / "Sie können jetzt Ihren Auftrag erstellen."
  2. `src/pages/HandwerkerOnboarding.tsx` (Zeilen 327–330): "Angemeldet" / "Fahren Sie mit der Registrierung fort."

## Änderungen
1. **SubmitLead-Login**: Erfolgs-Toast nach `setShowLoginForm(false)` entfernen. Der Flow setzt danach automatisch Schritt 2, das reicht als visuelles Feedback.
2. **HandwerkerOnboarding-Login**: Erfolgs-Toast nach dem Pre-fill der Profildaten entfernen. Der Wechsel zu Schritt 2 ist ausreichendes Feedback.
3. **Fehler-Toasts beibehalten**: Login-Fehler, unbestätigte E-Mail, Handwerker-Blockade etc. bleiben unverändert.
4. **Verifizierung**: Sicherstellen, dass keine weiteren "Anmeldung erfolgreich"/"Angemeldet"-Toasts im Code verbleiben.

## Nicht im Scope
- Keine Änderung an Fehler-Toasts.
- Keine Änderung am Auth-Flow oder an Redirect-Logik.
- Keine visuelle Ersatz-Benachrichtigung einführen.