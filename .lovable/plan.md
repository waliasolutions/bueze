# Manuelle Verlängerung des Reset-Links für Edgar Mkrtchyan

## Ziel

Der bestehende Reset-Link für `info.mkrtchyan@artmultiservis.ch` soll bis **Dienstag, 18. August 2026, 08:00 Uhr (Zürich)** gültig sein. Der Kunde bekommt daraufhin eine kurze Support-Mail mit klaren Anweisungen — ohne technische Details, ohne Erwähnung von «48 Stunden».

## Warum das geht

- `password_reset_tokens.expires_at` ist ein Wert pro Token, nicht global. Sein Token ist unbenutzt und kann einfach verlängert werden.
- Die Cleanup-Routine löscht nur abgelaufene Token. Ein zukünftiges Datum wird nicht entfernt.
- `validate-password-reset-token` prüft bei jedem Klick live gegen `expires_at`.

## Schritte

1. **Token verlängern**: `expires_at` auf `2026-08-18 06:00:00+00` UTC setzen (= 18.08.2026 08:00 Zürich/CEST), nur für seinen unbenutzten Token.
2. **Support-Mail senden** (SMTP2GO, Büeze-CI via `emailWrapper()`, BCC an info@walia-solutions.ch) mit diesem Text:

```text
Sehr geehrter Herr Mkrtchyan,

Ihr Konto bei Büeze.ch besteht bereits und ist freigegeben – eine neue Registrierung ist nicht nötig.

Bitte setzen Sie Ihr Passwort genau dort über den Link in der E-Mail, die Sie von uns erhalten haben. Bitte tun Sie dies bis Dienstag, 18. August um 08:00 Uhr.

Falls Sie weiterhin Unterstützung brauchen, können wir Sie zwischen Montag und Freitag kurz anrufen. Bitte geben Sie uns dazu 1–2 mögliche Zeiten an.

Freundliche Grüsse
Ihr Büeze.ch Team
```

3. **Kontrolle**: Ablaufzeit in der Datenbank und die Gültigkeit des Links mit der Prüf-Funktion verifizieren.

## Nicht enthalten

Keine Code- oder Policy-Änderung. Alle zukünftigen Token werden weiterhin mit der Standard-Gültigkeit von 1 Stunde erzeugt.
