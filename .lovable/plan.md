## Ziel
Auftrag "Renovationen" von Florim Maliqi (info@xl-renovation.ch) löschen, da er als Handwerker registriert ist und den Auftrag versehentlich als Auftraggeber erstellt hat. E-Mail-Versand an offene Angebote muss sofort gestoppt werden.

## Betroffener Datensatz
- Lead-ID: `f7e0e349-becd-4e96-b08a-5c8c2f96f16c`
- Titel: "Renovationen"
- Status: `active`
- Erstellt: 21.07.2026
- Offene Angebote (pending): **4**

## Vorgehen (analog zum Multi-Home-Fall, SSOT)
1. Alle 4 pending `lead_proposals` auf `rejected` setzen → verhindert weitere Handwerker-/Client-Trigger-Mails.
2. Lead-Status auf `deleted` setzen (Soft-Delete, konsistent mit bisheriger Praxis; FK `ON DELETE SET NULL` bereits gesetzt).
3. Verifizieren: keine `active`/`pending` Referenzen mehr, kein Notification-/E-Mail-Job pending.

## Technisch
Beides über das Insert/Update-Tool in einer Operation. Keine Code- oder Schema-Änderungen nötig.
