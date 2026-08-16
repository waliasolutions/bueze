# Registrierung/Passwort-Reset: Sackgasse dauerhaft beheben (Fall Edgar Mkrtchyan)

## Befund (geprüft in der Datenbank)

- Das Konto `info.mkrtchyan@artmultiservis.ch` **existiert bereits**, E-Mail bestätigt, letzter Login 05.08.2026.
- Das Handwerker-Profil «Art Multiservices, MKRTCHYAN» ist vorhanden und **freigegeben** (Rollen: user, handwerker).
- Folge: Jeder neue Registrierungsversuch endet zwangsläufig in «E-Mail bereits registriert». Der einzige Ausweg ist Login oder Passwort-Reset.
- Der Passwort-Reset-Endpunkt funktioniert technisch (Live-Test gibt 200 zurück). Reset-Token sind nicht mehr in der Tabelle, weil sie nach 1 Stunde ablaufen und vom nächtlichen Cleanup gelöscht werden — es ist daher **nicht nachvollziehbar**, ob seine Reset-Mails je erzeugt bzw. versendet wurden. Genau diese fehlende Nachvollziehbarkeit ist das eigentliche Problem.
- Im Fehlerfall zeigt die Oberfläche nur «Ein unerwarteter Fehler ist aufgetreten» — der Nutzer erfährt nichts und wir sehen nichts.

## Was wir umsetzen (klein und gezielt)

1. **Nachvollziehbarkeit**: `send-password-reset` schreibt Fehlschläge (Profil-Lookup, Token-Insert, SMTP2GO-Versand) ins bestehende `app_error_log` mit E-Mail und Grund. Erfolgreiche Sendungen werden nur geloggt (Konsole), keine neue Tabelle.
2. **Klare Meldungen**: Im Passwort-vergessen-Dialog statt der generischen Fehlermeldung die echte Ursache in de-CH anzeigen (z. B. «E-Mail konnte momentan nicht versendet werden – bitte in wenigen Minuten erneut versuchen»). Erfolgsfall bleibt neutral (keine Auskunft, ob ein Konto existiert).
3. **Kein Umweg mehr im Onboarding**: Erscheint in Schritt 1 «Konto bereits vorhanden», gibt es dort direkt einen Button «Passwort-Link senden» — ohne Seitenwechsel, der Entwurf bleibt erhalten. Dazu ein einziger gemeinsamer Helper `requestPasswordReset(email)`, den Login-Seite und Onboarding nutzen (SSOT, kein doppelter Code).
4. **Büeze-CI**: Die Reset-Mail wird über den bestehenden `emailWrapper()` gerendert; das doppelte Inline-HTML in der Funktion fällt weg.

## Sofortmassnahme für Edgar Mkrtchyan

- Passwort-Reset-Link für sein bestehendes Konto auslösen und ihm eine kurze, freundliche Antwortmail (Büeze-CI, SMTP2GO, BCC an info@walia-solutions.ch) schicken: Konto besteht und ist freigegeben, keine Neuregistrierung nötig, Link zum Passwort setzen, Angebot für einen kurzen Anruf.
- Den exakten Mailtext zeige ich vor dem Versand zur Bestätigung.

## Technische Details

- Geändert: `supabase/functions/send-password-reset/index.ts` (Logging + `emailWrapper()`), `src/pages/Auth.tsx` und `src/pages/HandwerkerOnboarding.tsx` (Helper-Nutzung, Inline-Reset-Button), neuer Helper in `src/lib/` (~20 Zeilen).
- Keine Datenbankänderung nötig (`app_error_log` und Retention-Cleanup existieren bereits).
- Nicht enthalten (YAGNI): eigene Reset-Statistik-Tabelle, Admin-UI für Reset-Verläufe, Änderungen an der Token-Lebensdauer.

## Zur «extremen Langsamkeit»

Dafür liegen aktuell keine Messdaten vor (Fehlerlog ist leer). Mit Punkt 1 sehen wir künftig serverseitige Fehlschläge; falls er nach dem Reset weiterhin Verzögerungen meldet, messen wir gezielt mit seinem Gerät/Netz nach.
