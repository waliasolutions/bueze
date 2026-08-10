# Webhook: «Aktivierung fehlgeschlagen (undefined)» — Ursache und dauerhafte Behebung

## Was war das Problem?
Die zwei Admin-Meldungen vom 9. August gehören zu den Payrexx-Transaktionen 39828942 und 39828939. In den Metadaten steht der echte Fehler:

```text
payment_history insert failed: there is no unique or exclusion constraint
matching the ON CONFLICT specification
```

Bestätigt in der Datenbank: `payment_history` hat auf `payrexx_transaction_id` **nur zwei partielle** Unique-Indizes (`… WHERE payrexx_transaction_id IS NOT NULL`). PostgREST-Upserts mit `onConflict: 'payrexx_transaction_id'` können partielle Indizes nicht verwenden — jeder Aktivierungsversuch bricht deshalb genau an der Idempotenz-Sperre ab, noch bevor das Abo geschrieben wird.

Zweiter, kleinerer Punkt: die Meldung zeigt «(undefined)», weil genau dieser Fehlerpfad in `activateFromConfirmedTransaction` keinen `errorCode` zurückgibt.

Kundenseitig betroffen: niemand. Die Referenz-ID zeigt auf das interne Testkonto `amit.walia@gmx.ch` (kein Profil, kein Abo, keine Zahlung erfasst). Es sind keine bezahlten Abos offen — es braucht also keine Datenreparatur, nur den strukturellen Fix.

## Behebung

1. **Datenbank (Ursache):** Die beiden doppelten partiellen Unique-Indizes durch **eine echte Unique-Constraint** auf `payment_history.payrexx_transaction_id` ersetzen. Postgres erlaubt bei Unique-Constraints beliebig viele NULL-Werte, der bisherige Zweck bleibt also erhalten — nur ist die Constraint jetzt für `ON CONFLICT` nutzbar. Damit funktioniert derselbe Upsert in allen drei Pfaden (Webhook, `verify-payrexx-payment`, RPC `admin_activate_subscription`).
2. **Fehlerklarheit:** `ActivationResult.errorCode` um `payment_history_insert_failed` erweitern und im betroffenen Return setzen. Keine Admin-Meldung sagt künftig mehr «undefined».
3. **DRY:** Der abgelehnt/fehlgeschlagen-Pfad im Webhook schreibt `payment_history` mit eigenem, kopiertem Upsert. Diesen in `_shared/payrexxActivation.ts` als `recordPayrexxPayment()` zusammenführen, sodass Tabelle, Konfliktziel und Feldnamen nur noch **an einer Stelle** definiert sind — genutzt von Erfolgs- und Fehlpfad.
4. **Verifikation:** Nach der Migration die Transaktion 39828942 über `verify-payrexx-payment` erneut durchlaufen lassen und prüfen, dass der Upsert greift (bzw. korrekt «already processed» meldet) und keine neue `webhook_error`-Meldung entsteht. Danach die zwei alten Admin-Meldungen als gelesen markieren.

## Bewusst nicht Teil davon (YAGNI)
Kein neuer Retry-Mechanismus, keine Reconcile-Cron, keine zusätzliche Monitoring-Ebene — die bestehende Idempotenz plus der Fallback auf `/payment-success` genügen, sobald die Constraint stimmt. Auch die partiellen Unique-Indizes auf `leads.request_id` / `lead_purchases.request_id` bleiben unverändert, da dort nirgends per `ON CONFLICT` upserted wird.

## SSOT-Check
- Eine Aktivierungspipeline: `activateFromConfirmedTransaction`.
- Eine Zahlungs-Schreibstelle: neues `recordPayrexxPayment()`.
- Eine Idempotenz-Quelle: die Unique-Constraint auf `payrexx_transaction_id`.
- Eine Fehlercode-Liste: `ActivationResult.errorCode`.
