

# Final Polish: Badge Variants + DRY Amount Formatting

Two trivial fixes across 4 files — completing the SSOT loop for subscription/invoicing UI.

---

## Fix 1: Apply `PLAN_BADGE_VARIANT` in JSX (4 files)

### `HandwerkerInvoices.tsx`
- **Line 17**: `import { getPlanLabel }` → `import { getPlanLabel, PLAN_BADGE_VARIANT }`
- **Line 217**: Replace `<TableCell>{getPlanLabel(invoice.plan_type)}</TableCell>` with:
```tsx
<TableCell>
  <Badge variant={PLAN_BADGE_VARIANT[invoice.plan_type] || 'outline'}>
    {getPlanLabel(invoice.plan_type)}
  </Badge>
</TableCell>
```
- **Line 272** (mobile): Keep as plain text — badge inside inline span looks wrong on mobile.

### `AdminInvoices.tsx`
- **Line 46**: Add `PLAN_BADGE_VARIANT` to import
- **Line 378**: Same Badge wrap pattern

### `AdminPayments.tsx`
- **Line 63**: Add `PLAN_BADGE_VARIANT` to import
- **Line 383**: Same Badge wrap pattern

### `PaymentHistoryTable.tsx`
- **Line 13**: Add `PLAN_BADGE_VARIANT` to import
- **Line 171**: Same Badge wrap pattern

---

## Fix 2: Replace local `formatAmount` with `formatInvoiceAmount` (2 files)

### `AdminPayments.tsx`
- **Line 63**: Add `import { formatInvoiceAmount } from '@/config/invoiceConfig';`
- **Lines 78-83**: Delete the local `formatAmount` function entirely
- **Lines 237, 254, 288, 385**: Replace all `formatAmount(...)` → `formatInvoiceAmount(...)`

### `PaymentHistoryTable.tsx`
- **Line 13 area**: Add `import { formatInvoiceAmount } from '@/config/invoiceConfig';`
- **Lines 43-48**: Delete the local `formatAmount` function entirely
- **Line 149**: `formatAmount(totalPaid, 'chf')` → `formatInvoiceAmount(totalPaid)`
- **Line 173**: `formatAmount(payment.amount, payment.currency)` → `formatInvoiceAmount(payment.amount, payment.currency)`

---

## Post-Deploy Visual Audit

1. **Admin > Payments**: Verify Revenue Stats (Total/Monthly/Avg) still format correctly. Confirm plan type column now shows color-coded badges.
2. **Admin > Invoices**: Confirm plan type badges appear with correct variant styling.
3. **Handwerker > Rechnungen**: Verify desktop table shows plan badges, mobile cards keep plain text.

