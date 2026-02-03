

# Behebung: Kritische Billing-Bugs & Einkommensübersicht

## Zusammenfassung

Nach umfassender Analyse des gesamten Billing- und Einkommensystems habe ich **2 kritische Bugs** identifiziert, die dazu führen, dass Umsatzdaten falsch oder gar nicht angezeigt werden.

---

## Kritische Bugs gefunden

### BUG 1: Status-Mismatch (`'succeeded'` vs `'paid'`)

**Problem:** Der Payrexx-Webhook speichert Zahlungen mit `status: 'succeeded'`, aber alle UI-Komponenten filtern nach `status: 'paid'`.

| Komponente | Filter-Status | Webhook-Status | Match? |
|------------|---------------|----------------|--------|
| AdminDashboard | `paid` | `succeeded` | ❌ NEIN |
| AdminPayments | `paid` | `succeeded` | ❌ NEIN |
| PaymentHistoryTable | `paid` | `succeeded` | ❌ NEIN |

**Auswirkung:** Alle tatsächlichen Zahlungen werden nicht in der Umsatzübersicht angezeigt!

**Betroffene Dateien:**
- `supabase/functions/payrexx-webhook/index.ts` (Zeile 151)

---

### BUG 2: Doppelte Division durch 100

**Problem:** Payrexx sendet Beträge in Rappen (z.B. 9000 = CHF 90.00). Der Webhook teilt bereits durch 100 vor dem Speichern, aber alle UI-Komponenten teilen nochmals durch 100 bei der Anzeige.

**Berechnungsfehler:**
```
Payrexx sendet: 9000 Rappen (= CHF 90.00)
Webhook speichert: 9000 / 100 = 90
UI zeigt an: 90 / 100 = CHF 0.90 ❌
```

**Betroffene Dateien:**
- `supabase/functions/payrexx-webhook/index.ts` (Zeilen 148, 200)
- `src/pages/admin/AdminDashboard.tsx` (Zeile 101)
- `src/pages/admin/AdminPayments.tsx` (Zeile 90)
- `src/components/PaymentHistoryTable.tsx` (Zeile 55)

---

## Lösungsplan

### Fix 1: Status-Korrektur im Webhook

**Datei:** `supabase/functions/payrexx-webhook/index.ts`

Zeile 151 ändern von:
```typescript
status: 'succeeded',
```
zu:
```typescript
status: 'paid',
```

Zeile 203 ändern von:
```typescript
status: 'failed',
```
(bleibt) - aber Konsistenz-Check: fehlgeschlagene Zahlungen haben korrekterweise `status: 'failed'`

### Fix 2: Betrag-Speicherung in Rappen (ohne Division)

**Datei:** `supabase/functions/payrexx-webhook/index.ts`

Zeile 148 ändern von:
```typescript
amount: amount / 100, // Convert from Rappen to CHF
```
zu:
```typescript
amount: amount, // Store in Rappen (cents) as per schema
```

Zeile 200 ebenso ändern von:
```typescript
amount: amount / 100,
```
zu:
```typescript
amount: amount, // Store in Rappen (cents) as per schema
```

---

## Bestehende Einkommensübersicht (Bereits implementiert)

### Für Handwerker:
| Feature | Ort | Status |
|---------|-----|--------|
| Zahlungshistorie | Profil → "Rechnungen" Tab | ✅ Vorhanden |
| Total bezahlt | PaymentHistoryTable Header | ✅ Vorhanden |
| PDF-Rechnungen | Download-Button pro Zahlung | ✅ Vorhanden |
| Abo-Übersicht | Profil → "Abonnement" Tab | ✅ Vorhanden |

### Für Admin:
| Feature | Ort | Status |
|---------|-----|--------|
| Gesamtumsatz | AdminDashboard Karte | ✅ Vorhanden |
| Monatsumsatz | AdminPayments | ✅ Vorhanden |
| Aktive Abos | AdminPayments | ✅ Vorhanden |
| Ø Umsatz pro Nutzer | AdminPayments | ✅ Vorhanden |
| Abo-Verteilung (Pie Chart) | AdminPayments | ✅ Vorhanden |
| Zahlungstabelle | AdminPayments | ✅ Vorhanden |

---

## Optionale Verbesserungen

### Enhancement 1: Monatsumsatz im Handwerker-Dashboard

Aktuell sehen Handwerker nur ihre Zahlungshistorie. Eine kompakte Übersicht wäre nützlich:

```
┌──────────────────────────────────────┐
│ 💰 Ihre Ausgaben                     │
│                                      │
│ Diesen Monat: CHF 90.00              │
│ Gesamt bezahlt: CHF 270.00           │
│ Nächste Zahlung: 15.02.2026          │
└──────────────────────────────────────┘
```

### Enhancement 2: Revenue-Trend im Admin-Dashboard

Ein einfaches Liniendiagramm für die letzten 6 Monate wäre hilfreich:

```
Revenue Trend (CHF)
│
│     ╭─────╮
│    ╭╯     ╰───╮
│ ──╯           ╰──
└─────────────────────
  Okt  Nov  Dez  Jan
```

---

## Dateien zu ändern

| Datei | Änderung | Priorität |
|-------|----------|-----------|
| `supabase/functions/payrexx-webhook/index.ts` | Status 'paid' statt 'succeeded', Amount ohne Division | ⚠️ KRITISCH |

---

## Zusammenfassung

Das Billing-System ist architektonisch korrekt aufgebaut:
- Zahlungen werden via Payrexx-Webhook erfasst
- `payment_history` Tabelle speichert alle Transaktionen
- Handwerker sehen ihre Rechnungen im Profil
- Admins haben eine vollständige Umsatzübersicht

**Aber:** Durch die zwei Bugs werden aktuell **keine Zahlungen** korrekt angezeigt. Nach dem Fix funktioniert alles wie vorgesehen.

