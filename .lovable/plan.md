# QA des Passwort-Reset-Flows vor dem Mailversand (Fall Edgar Mkrtchyan)

## Was ich live geprüft habe

- **Konto**: `info.mkrtchyan@artmultiservis.ch` = Auth-User `d15c925c…`, E-Mail bestätigt. Das `profiles.id` ist identisch mit der Auth-User-ID — der Reset-Token zeigt also auf den richtigen Benutzer, das Passwort-Update greift.
- **Token**: Es existiert genau ein Token für ihn, erstellt 08:04 Uhr Zürich, gültig bis **09:04 Uhr Zürich**, noch nicht benutzt. Die Mail ist raus.
- **Link-Prüfung**: `validate-password-reset-token` antwortet live korrekt (ungültiger Test-Token → «Ungültiger oder abgelaufener Link», HTTP 400 sauber).
- **Zielseite**: `https://bueeze.ch/reset-password?token=…` liefert HTTP 200, Route existiert, Token wird direkt aus der URL gelesen und vorab validiert.
- **Mailtemplate**: läuft über `emailWrapper()` (Büeze-CI), Button plus Klartext-Link als Fallback.

## Das eine echte Problem

Der Link ist **nur 1 Stunde gültig** und läuft heute um 09:04 Uhr ab. Wenn ich jetzt eine Support-Mail mit «wir haben Ihnen soeben einen Link geschickt» schicke, ist der Link vermutlich schon abgelaufen, bevor er ihn öffnet — genau die Sackgasse, die er gemeldet hat.

## Vorgehen (klein, in dieser Reihenfolge)

1. **Frischen Reset-Link auslösen** unmittelbar vor dem Mailversand, damit Link und Support-Mail zeitgleich ankommen.
2. **Gültigkeitsdauer auf 24 Stunden erhöhen** in `send-password-reset` (eine Zeile: `60 * 60 * 1000` → `24 * 60 * 60 * 1000`) und im Mailtext «1 Stunde» → «24 Stunden». Token bleibt einmalig verwendbar und wird nach Ablauf weiterhin automatisch gelöscht — Sicherheitsniveau bleibt praktisch gleich, die Sackgasse verschwindet für alle Nutzer.
3. **Support-Mail senden** (SMTP2GO, Büeze-CI via `emailWrapper()`, BCC an info@walia-solutions.ch) mit folgendem Text:

```text
Sehr geehrter Herr Mkrtchyan

Ihr Konto bei Büeze.ch besteht bereits und ist freigegeben – eine neue Registrierung ist nicht nötig.

Wir haben Ihnen soeben eine E-Mail mit einem Link zum Setzen eines neuen Passworts geschickt. Der Link ist 24 Stunden gültig. Danach können Sie sich direkt anmelden.

Falls Sie weiterhin Unterstützung brauchen, können wir Sie zwischen Montag und Freitag kurz anrufen. Bitte geben Sie uns dazu 1–2 mögliche Zeiten an.

Freundliche Grüsse
Ihr Büeze.ch Team
```

4. **Danach kontrollieren**: neuer Token in der Datenbank vorhanden, Versand erfolgreich, kein neuer Eintrag im Fehlerlog.

## Nicht enthalten (YAGNI)

Keine neue Tabelle, kein Admin-UI für Reset-Verläufe, keine Änderung am Login- oder Onboarding-Code — der SSOT-Helper `requestPasswordReset` und das Fehler-Logging sind bereits umgesetzt.
