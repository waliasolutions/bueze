# Nachricht an Edgar Mkrtchyan: Passwort setzen + Reset erklären

Empfänger: `info.mkrtchyan@artmultiservis.ch` (Art Multiservices), BCC an `info@walia-solutions.ch`.
Sprache: Deutsch (de-CH). Versand erst auf dein «senden»-Kommando.

## Ablauf (nach deiner Freigabe)

1. Passwort seines bestehenden Kontos auf `A12345678!` setzen (bestehende Admin-Funktion `reset-user-password` mit `notifyUsers: false`, keine Zusatz-Mail).
2. Eine Mail über SMTP2GO im Büeze-CI (`emailWrapper()`) senden, BCC an `info@walia-solutions.ch`, Absender `Büeze.ch <noreply@bueeze.ch>`.
3. Keine Code- oder Datenbankänderung nötig — bestehende Funktionen werden genutzt (SSOT/DRY).

## Mailtext zur Bestätigung

**Betreff:** Ihr Zugang zu Büeze.ch – Passwort und Anmeldung

> Guten Tag Herr Mkrtchyan
>
> Vielen Dank für Ihre Geduld. Leider können wir den Support derzeit nicht auf Französisch anbieten – wir hoffen, diese deutsche Anleitung hilft Ihnen weiter.
>
> **Sofort anmelden**
> Wir haben für Sie ein Standard-Passwort gesetzt:
> Benutzername (E-Mail): info.mkrtchyan@artmultiservis.ch
> Passwort: A12345678!
>
> Damit können Sie sich sofort anmelden. Es ist ein Standard-Passwort – Sie können es jederzeit in Ihrem Profil ändern.
> [Jetzt anmelden] (Button → https://bueeze.ch/auth)
>
> **Falls Sie das Passwort selbst zurücksetzen möchten**
> 1. Öffnen Sie https://bueeze.ch/auth und klicken Sie auf «Passwort vergessen».
> 2. Geben Sie Ihre E-Mail-Adresse ein.
> 3. Sie erhalten eine E-Mail mit einem Link. Wichtig: Dieser Link ist nur **eine Stunde** gültig und kann nur **einmal** verwendet werden.
> 4. Öffnen Sie den Link innerhalb dieser Stunde und vergeben Sie Ihr neues Passwort.
>
> Wir freuen uns auf Ihre Rückmeldung, ob die Anmeldung nun funktioniert. Bei Fragen erreichen Sie uns unter info@bueeze.ch; ein kurzer Telefontermin an Werktagen ist ebenfalls möglich – bitte beachten Sie, dass wir für Anrufe nur **Deutsch oder Englisch** anbieten können.
>
> Freundliche Grüsse
> Ihr Büeze.ch Team

## Technische Details

- Passwortsetzung: Edge Function `reset-user-password` (`customPassword: 'A12345678!'`, `notifyUsers: false`).
- Mailversand: `send-support-email` bzw. bestehender SMTP2GO-Helper mit `emailWrapper()`; Dedupe-Lock verhindert Doppelversand.
- Keine neuen Dateien, keine Migration.
