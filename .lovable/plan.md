

# Pending Plan Selection with Approval-First Workflow

## Overview
The user wants a workflow where:
1. A handwerker can select a **paid plan** during registration or from the pricing page
2. They must still be **approved first** before paying
3. After approval, they receive an **email with a payment link** for their selected plan
4. They should be able to **cancel/downgrade to free** if they change their mind before paying

Currently, selecting a paid plan immediately redirects to payment without checking approval status, and there's no mechanism to store the "desired plan" preference.

---

## Implementation Plan

### Phase 1: Database Schema Update

#### Add `pending_plan` Column to `handwerker_subscriptions`
A new nullable column to store the user's desired plan selection before payment:

```sql
ALTER TABLE handwerker_subscriptions
ADD COLUMN pending_plan text DEFAULT NULL;
```

This stores the plan the user selected (e.g., `monthly`, `6_month`, `annual`) before approval. Once they pay, it clears.

---

### Phase 2: Frontend Changes

#### 2.1 Update Checkout Page (`src/pages/Checkout.tsx`)

**Add approval status check** before allowing payment:

1. Check if user has `handwerker_profiles.verification_status = 'approved'`
2. If **approved**: proceed with current payment flow
3. If **pending**: 
   - Save selected plan to `handwerker_subscriptions.pending_plan`
   - Show message: "Ihr Profil wird noch geprüft. Nach der Freischaltung erhalten Sie einen Zahlungslink per E-Mail."
   - Provide button to **downgrade to free** (clear pending_plan)
4. If **not a handwerker**: redirect to onboarding

**New UI States:**
- Pending approval: Show info message, save plan button, cancel button
- Approved without pending plan: Normal checkout flow
- Approved with pending plan: Auto-redirect to payment

#### 2.2 Update Pricing Page (`src/pages/legal/PricingPage.tsx`)

Update `handleSelectPlan` to check approval status:
- If approved handwerker → `/checkout?plan={planId}` (current behavior)
- If pending handwerker → save to pending_plan, show confirmation message
- If no handwerker profile → `/handwerker-onboarding?plan={planId}` (pass selected plan)

#### 2.3 Update Handwerker Onboarding (`src/pages/HandwerkerOnboarding.tsx`)

- Read `?plan=` query parameter if present
- Store in form data to be saved as `pending_plan` after registration
- Display selected plan in summary step

#### 2.4 Add Pending Plan UI Component

Create `src/components/PendingPlanCard.tsx`:
- Shows the selected pending plan
- "Abonnement stornieren" button to clear pending_plan and stay on free
- Displayed in Profile page subscription tab when pending_plan exists

---

### Phase 3: Admin Approval Flow Update

#### 3.1 Update `send-approval-email` Edge Function

Modify to include payment link if `pending_plan` exists:

```typescript
// After approval, check for pending plan
const { data: subscription } = await supabase
  .from('handwerker_subscriptions')
  .select('pending_plan')
  .eq('user_id', userId)
  .single();

if (subscription?.pending_plan) {
  // Generate payment link and include in email
  const paymentUrl = `https://bueeze.ch/checkout?plan=${subscription.pending_plan}`;
  // Use template with payment CTA
} else {
  // Standard approval email without payment CTA
}
```

**Updated Email Template** when `pending_plan` exists:
- Subject: "🎉 Profil freigeschaltet - Jetzt Abo aktivieren"
- Body includes:
  - Confirmation of approval
  - Selected plan details (name, price)
  - Prominent "Jetzt bezahlen" button linking to `/checkout?plan={pending_plan}`
  - Option to "Kostenlos starten" linking to `/profile?tab=subscription&cancel_pending=true`

#### 3.2 Update HandwerkerApprovals.tsx

Display pending_plan info in admin view so admins can see what the handwerker intends to subscribe to.

---

### Phase 4: Cancellation/Downgrade Flow

#### 4.1 Add Cancel Pending Plan Functionality

**Profile Page** (`src/pages/Profile.tsx`):
- Read `?cancel_pending=true` query param
- Clear `pending_plan` from subscription
- Show toast: "Ihr geplantes Abo wurde storniert. Sie bleiben auf dem kostenlosen Plan."

**PendingPlanCard Component**:
- "Plan stornieren" button
- Clears `pending_plan` in database
- Refreshes subscription state

#### 4.2 Update SubscriptionManagement Component

Add section to display pending plan with cancel option:

```tsx
{currentSubscription?.pendingPlan && (
  <Card>
    <CardHeader>
      <CardTitle>Geplantes Upgrade</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Sie haben {pendingPlanName} ausgewählt.</p>
      <p>Nach der Zahlung wird Ihr Abo aktiviert.</p>
      <div className="flex gap-2">
        <Button onClick={handlePayNow}>Jetzt bezahlen</Button>
        <Button variant="outline" onClick={handleCancelPending}>
          Stornieren (kostenlos bleiben)
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

### Phase 5: Backend Updates

#### 5.1 Update useSubscription Hook

Add `pendingPlan` to returned subscription data.

#### 5.2 Update Webhook Handlers

After successful payment, clear `pending_plan`:

```typescript
// In payrexx-webhook and stripe-webhook
.upsert({
  // ... existing fields
  pending_plan: null, // Clear pending plan after payment
})
```

---

## Technical Summary

| File | Action | Purpose |
|------|--------|---------|
| DB Migration | Create | Add `pending_plan` column to subscriptions |
| `src/pages/Checkout.tsx` | Modify | Check approval status, save pending plan |
| `src/pages/legal/PricingPage.tsx` | Modify | Route based on approval status |
| `src/pages/HandwerkerOnboarding.tsx` | Modify | Accept plan param, save as pending |
| `src/components/PendingPlanCard.tsx` | Create | Display pending plan with cancel option |
| `src/components/SubscriptionManagement.tsx` | Modify | Show pending plan section |
| `src/pages/Profile.tsx` | Modify | Handle cancel_pending query param |
| `src/hooks/useSubscription.ts` | Modify | Include pendingPlan in return |
| `supabase/functions/send-approval-email/index.ts` | Modify | Include payment link if pending_plan |
| `supabase/functions/payrexx-webhook/index.ts` | Modify | Clear pending_plan after payment |
| `supabase/functions/stripe-webhook/index.ts` | Modify | Clear pending_plan after payment |
| `src/pages/admin/HandwerkerApprovals.tsx` | Modify | Display pending_plan in admin view |

---

## User Flow Diagrams

### New User Selects Paid Plan

```text
User visits /pricing
      │
      ├── Clicks "Jetzt abonnieren" on paid plan
      │
      ▼
Is user logged in?
      │
      ├── No → /auth → redirect back
      │
      ▼
Is user an approved handwerker?
      │
      ├── Yes → /checkout?plan={planId} → Payment
      │
      ├── No (pending) → Save pending_plan
      │                   Show "Wir prüfen Ihr Profil"
      │                   Email sent after approval with payment link
      │
      └── No (no profile) → /handwerker-onboarding?plan={planId}
```

### After Approval with Pending Plan

```text
Admin approves handwerker
      │
      ▼
Check pending_plan in subscription
      │
      ├── pending_plan exists → Send email with payment CTA
      │
      └── No pending_plan → Standard approval email
      
User receives email
      │
      ├── Click "Jetzt bezahlen" → /checkout?plan={pending_plan}
      │                            Payment completes
      │                            pending_plan cleared
      │
      └── Click "Kostenlos starten" → /profile?cancel_pending=true
                                       pending_plan cleared
                                       Stays on free tier
```

### Cancel Pending Plan

```text
User in /profile (subscription tab)
      │
      ▼
Sees "Geplantes Upgrade" card
      │
      ├── Click "Stornieren" → pending_plan = null
      │                         Toast: "Sie bleiben kostenlos"
      │
      └── Click "Jetzt bezahlen" → /checkout (proceeds with payment)
```

---

## Key Benefits

1. **No premature payments**: Users don't pay until approved
2. **Clear intent tracking**: Admins see what plan users want
3. **Flexible cancellation**: Users can change their mind at any point
4. **Email-driven conversion**: Payment link in approval email drives subscription activation
5. **Consistent with SSOT**: Uses existing subscription table with minimal schema change

