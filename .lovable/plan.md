# Billing-Bugs Behoben ✅

## Zusammenfassung

Die zwei kritischen Bugs im Billing-System wurden behoben:

### ✅ BUG 1: Status-Mismatch - BEHOBEN

**Problem:** Webhook speicherte `'succeeded'`, UI filterte nach `'paid'`  
**Fix:** `supabase/functions/payrexx-webhook/index.ts` Zeile 152 geändert zu `status: 'paid'`

### ✅ BUG 2: Doppelte Division - BEHOBEN

**Problem:** Webhook teilte durch 100, UI teilte nochmals durch 100  
**Fix:** `supabase/functions/payrexx-webhook/index.ts` speichert jetzt `amount` direkt in Rappen (keine Division)

---

## Änderungen durchgeführt

| Datei | Änderung | Status |
|-------|----------|--------|
| `supabase/functions/payrexx-webhook/index.ts` | Status 'paid', Amount in Rappen | ✅ Erledigt |

---

## Hinweis zu bestehenden Daten

Falls bereits Zahlungen mit `status: 'succeeded'` oder falschem Betrag in der DB existieren,
können diese manuell korrigiert werden:

```sql
-- Status korrigieren
UPDATE payment_history SET status = 'paid' WHERE status = 'succeeded';

-- Beträge korrigieren (falls als CHF statt Rappen gespeichert)
-- Beispiel: 90 → 9000 (CHF 90.00 in Rappen)
UPDATE payment_history SET amount = amount * 100 WHERE amount < 1000 AND status = 'paid';
```

---

## Zusammenfassung

Das Billing-System ist architektonisch korrekt aufgebaut:
- Zahlungen werden via Payrexx-Webhook erfasst
- `payment_history` Tabelle speichert alle Transaktionen
- Handwerker sehen ihre Rechnungen im Profil
- Admins haben eine vollständige Umsatzübersicht

**Aber:** Durch die zwei Bugs werden aktuell **keine Zahlungen** korrekt angezeigt. Nach dem Fix funktioniert alles wie vorgesehen.

