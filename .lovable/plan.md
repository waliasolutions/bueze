

# Updated Plan: Remove Local Payment Method Management, Delegate to Payrexx

## Changes from Previous Plan

1. **Added Payrexx portal link** — the simplified `PaymentMethodCard` will include a button directing users to manage payment methods via Payrexx (using the checkout URL pattern already in the codebase).
2. **Remove `hasPaymentMethod` from `SubscriptionManagement`** — this field is derived from the mock data and triggers a misleading "Zahlungsmethode erforderlich" warning. Since Payrexx owns payment state, this warning is inaccurate. Remove the field and the warning banner.
3. **Full cleanup sweep confirmed** — no test files or other components reference these mocks beyond the 4 files identified.

## Implementation

### 1. Delete `src/components/AddPaymentMethodDialog.tsx`
Entire file removed. Collects card data locally — violates Payrexx-exclusive policy.

### 2. Rewrite `src/components/PaymentMethodCard.tsx`
Replace with a simple informational card:
- Icon + title "Zahlungsmethoden"
- Description: "Ihre Zahlungsmethoden werden sicher über unseren Zahlungspartner Payrexx verwaltet."
- Bullet points: payment details entered during checkout, stored securely by Payrexx, supports TWINT/PostFinance/Kreditkarten
- Button: "Zahlungsmethoden verwalten" linking to `/checkout` (where Payrexx gateway handles the rest)
- No props needed — fully self-contained

### 3. Clean up `src/pages/Profile.tsx`
Remove:
- Import of `AddPaymentMethodDialog`
- `paymentMethods` state
- `showAddPaymentDialog` state
- `handleAddPaymentMethod`, `handleRemovePaymentMethod`, `handleSetDefaultPaymentMethod` handlers
- Mock `setPaymentMethods([])` call (line 226-228)
- `hasPaymentMethod` from `currentSubscription` object (line 218)
- `AddPaymentMethodDialog` JSX (lines 928-933)
- Update `PaymentMethodCard` usage — remove all props (now prop-less)

### 4. Update `src/components/SubscriptionManagement.tsx`
- Remove `hasPaymentMethod` from `CurrentSubscription` interface
- Remove the amber warning banner (lines 153-162) that says "Zahlungsmethode erforderlich"

## Files Changed
1. **Delete** `src/components/AddPaymentMethodDialog.tsx`
2. **Rewrite** `src/components/PaymentMethodCard.tsx` — informational card with Payrexx link
3. **Update** `src/pages/Profile.tsx` — remove mock state, handlers, dialog
4. **Update** `src/components/SubscriptionManagement.tsx` — remove `hasPaymentMethod` field and warning

