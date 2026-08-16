# Bestehenden Reset-Link von Edgar Mkrtchyan auf 48 Stunden verlängern

Ja, das geht — und zwar ohne neue Mail und ohne Änderung für alle anderen.

## Warum es funktioniert (geprüft)

- Die Gültigkeit steht **pro Token** in der Spalte `expires_at` der Tabelle `password_reset_tokens`. Es gibt keine globale Einstellung, die wir anfassen müssten.
- Sein Token (erstellt 08:04 Zürich, aktuell gültig bis 09:04 Zürich) ist **unbenutzt** — der Link in der bereits versendeten Mail bleibt derselbe und funktioniert nach der Verlängerung weiter.
- Die nächtliche Aufräum-Routine löscht nur Token, deren Ablaufzeit **bereits vergangen** ist. Ein Token mit 48 Stunden Restlaufzeit wird also nicht gelöscht.
- Die Prüf-Funktion vergleicht bei jedem Klick `expires_at > now()` und dass der Token noch nicht benutzt ist — sie liest immer den aktuellen Wert, kein Cache.

## Was wir machen

1. **Nur seinen Token verlängern**: `expires_at` auf jetzt + 48 Stunden setzen (nur dieser eine Datensatz, gezielt über seine E-Mail und `used_at is null`).
2. **Kein Zurücksetzen nötig**: Es gibt nichts, was nach 48 Stunden «zurückgestellt» werden müsste. Alle künftigen Reset-Links werden weiterhin mit **1 Stunde** erzeugt, weil der Standardwert im Code (`send-password-reset`) unverändert bleibt. Sein verlängerter Token verfällt nach 48 Stunden von selbst und wird beim nächsten Cleanup entfernt.
3. **Support-Mail** (SMTP2GO, Büeze-CI, BCC an info@walia-solutions.ch) mit Hinweis auf die bereits erhaltene Mail:

```text
Sehr geehrter Herr Mkrtchyan

Ihr Konto bei Büeze.ch besteht bereits und ist freigegeben – eine neue Registrierung ist nicht nötig.

Sie haben von uns eine E-Mail mit einem Link zum Setzen eines neuen Passworts erhalten. Wir haben die Gültigkeit dieses Links für Sie auf 48 Stunden verlängert, damit Sie in Ruhe Zeit haben. Danach können Sie sich direkt anmelden.

Falls Sie weiterhin Unterstützung brauchen, können wir Sie zwischen Montag und Freitag kurz anrufen. Bitte geben Sie uns dazu 1–2 mögliche Zeiten an.

Freundliche Grüsse
Ihr Büeze.ch Team
```

4. **Kontrolle danach**: neue Ablaufzeit in der Datenbank bestätigen und den Link mit der Prüf-Funktion einmal als «gültig» verifizieren.

## Technische Details

- Ein einmaliges, gezieltes `UPDATE` auf `public.password_reset_tokens` für `email = 'info.mkrtchyan@artmultiservis.ch'` und `used_at is null`. Keine Struktur-, Policy- oder Code-Änderung.
- Standard-Ablaufzeit in `supabase/functions/send-password-reset/index.ts` bleibt bei 1 Stunde (SSOT unberührt).
