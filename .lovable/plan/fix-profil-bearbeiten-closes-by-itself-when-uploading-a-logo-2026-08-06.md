# Fix: Profil-Bearbeiten "closes by itself" when uploading a logo

Reported by Edgar Mkrtchyan (Art Multiservices, MKRTCHYAN — profile is `approved`, `logo_url` is still empty, so no logo ever landed). The page he uses is `src/pages/HandwerkerProfileEdit.tsx`.

## Was gesichert ist – und was nicht

Nicht gesichert: die genaue Ursache in seinem Fall. Ich habe keinen Log von seinem Gerät. Was ich prüfen konnte:

- Sein Profil ist `approved`, `logo_url` ist leer – es ist also nie ein Logo angekommen.
- Die Storage-Rechte sind in Ordnung: die Policies auf `handwerker-portfolio` erlauben Upload/Update im eigenen Ordner `{user_id}/…` für angemeldete Handwerker, und sein Konto erfüllt das. **«Speicher-Berechtigung fehlt» ist in seinem Fall also nicht die Ursache** – es wäre nur eine von mehreren möglichen Meldungen im neuen Fehlertext, die nur dann erscheint, wenn Supabase wirklich einen Rechtefehler zurückgibt. Wenn das nur verwirrt, lassen wir diesen Fall weg.

Drei belegte Schwachstellen auf der Seite, die alle wie «die Seite schliesst sich von selbst» aussehen:

1. **Weisse Seite statt Fehlermeldung.** Scheitert das initiale Laden, zeigt der Code nur einen Toast und lässt `profile` auf `null`; die Komponente rendert dann `return null` – eine komplett leere Seite.
2. **Harte Weiterleitung bei Auth-Aussetzer.** Die Seite ruft beim Mount `supabase.auth.getUser()` (Netzwerkaufruf) und leitet sofort auf `/auth` um, sobald kein User zurückkommt. Auf iOS wird der Tab beim Öffnen der Fotoauswahl suspendiert/neu geladen – kommt er mit noch nicht erneuerter Sitzung zurück, fliegt der Nutzer von der Seite.
3. **Logo-/Bild-Upload umgeht die vorhandene Upload-SSOT.** `handleLogoUpload` und `handleImageUpload` sind handgeschrieben: Originaldatei, keine Komprimierung, harte 5-MB-Ablehnung, Dateiendung aus dem Dateinamen. Ein iPhone-Foto (5–15 MB, teils HEIC) wird deshalb entweder abgelehnt oder unkomprimiert über Mobilfunk geschoben – genau dort beendet Safari den Tab. `compressToWebP` + das Muster aus `src/lib/fileUpload.ts` (für Lead-Medien und Offert-Anhänge) existiert bereits, wird hier aber nicht genutzt.

## Plan

### 1. Fehler auf der echten Seite reproduzieren (vor jeder Verhaltensänderung)
Profil-Seite im Headless-Browser mit einer Handwerker-Sitzung öffnen, ein grosses iPhone-Bild hochladen, Konsole und Netzwerk mitschneiden. Damit wissen wir, welcher der drei Pfade bei ihm gefeuert hat, statt zu raten. Zusätzlich: Sentry-/Konsolen-Meldungen der letzten Tage zu dieser Route durchsehen.

### 2. Logo-Upload über die bestehende Upload-SSOT
`src/lib/fileUpload.ts` um eine Funktion `uploadHandwerkerImage(file, userId, kind)` erweitern, die den bestehenden Ablauf wiederverwendet (validieren → `compressToWebP` → Upload → publicUrl; Bucket `handwerker-portfolio`, `contentType` gesetzt, fester Pfad `logo.webp` mit `upsert: true`, Zeitstempel-Pfad für Portfolio-Bilder). Die duplizierte Inline-Logik in `handleLogoUpload` und `handleImageUpload` entfällt; die Onboarding-Seite nutzt denselben Helfer, falls sie dasselbe dupliziert.

Effekt: aus 12 MB iPhone-Foto wird vor dem Netzwerk ein ~150-KB-WebP – keine Grössen-Ablehnung, kein Speicher-Peak, kein HEIC-Problem.

### 3. Keine weisse Seite – stattdessen eine klare Fehlermeldung
Alle Texte de-CH (keine französischen Varianten, «Guillemets», kein ß).

- Bei Ladefehler bleibt die Seite montiert und zeigt eine Fehlerkarte, die konkret benennt, was passiert ist, statt nur «Erneut versuchen»: Titel («Profil konnte nicht geladen werden»), Ursache im Klartext (z. B. «Keine Verbindung zum Server», «Sitzung abgelaufen – bitte neu anmelden», «Kein Handwerker-Konto für diesen Login»), die technische Meldung als Detailzeile, plus die nächste Handlung («Erneut laden» bzw. «Neu anmelden»).
- Upload-Fehler analog direkt beim Logo-Feld: welcher Dateityp nicht geht, dass die Datei auch nach der Komprimierung zu gross ist (mit Ist-Grösse), oder dass die Verbindung unterbrochen wurde – und was er tun soll. Rechtefehler nur als Fallback, wenn Supabase tatsächlich einen liefert.
- Mapping von Fehlerursache zu Text kommt aus einem einzigen Helfer (Erweiterung von `src/lib/errorCategories.ts`), damit Ladefehler, Upload-Fehler und Speicherfehler dieselben Formulierungen nutzen (SSOT, keine dritten Textvarianten).
- Der Mount-Gate nutzt `getSession()` statt `getUser()`; Weiterleitung auf `/auth` nur bei wirklich fehlender Sitzung – niemals bei Netzwerkfehlern.
- Der Upload-Button bleibt während `uploading` deaktiviert und zeigt den Fortschrittszustand, damit ein langsamer Mobil-Upload nicht wie ein Absturz wirkt.

### 4. Verify
Re-run the browser check: upload a large image, confirm the compressed logo appears, `logo_url` is written by autosave, and the page stays mounted. Confirm the load-error path renders the explicit error card (with cause + action) instead of a blank screen.

### 5. Antwort an den Handwerker
Nicht automatisiert – ich liefere dir einen kurzen deutschen (de-CH) Text, den du senden kannst, sobald der Fix live ist.


## Notes on scope (SSOT / DRY / YAGNI)
- No new upload library, no new bucket, no new state machine: one shared function added to the file that already owns uploads, duplicated code removed.
- No design changes to the page beyond the error card and the disabled/progress state on the upload button.
- Document uploads keep using `DocumentManagementSection`; they are only touched if they duplicate the same inline upload code.
