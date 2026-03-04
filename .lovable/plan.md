

# Fix Payrexx 422 Error and Billing Workflow Overview

## 1. The Payrexx 422 "Unprocessable Content" Error

### Root Cause (confirmed via Payrexx SDK source code)

The signature is computed on the **wrong string format**. Looking at the [official Payrexx Node SDK](https://github.com/3AP-AG/payrexx-sdk), the `AuthHelper.buildPayloadWithSignature` method:

1. Uses `qs.stringify(params, { format: 'RFC1738' })` to **URL-encode** the parameters
2. Signs that URL-encoded string with HMAC-SHA256 base64
3. Sends the body as `qs.stringify({ ...params, ApiSignature: signature })`

Our current code does two things wrong:

- **`buildQueryString` does NOT URL-encode values** — it joins raw `key=value` pairs. But the signature must be computed on the URL-encoded form (e.g., `fields%5Bemail%5D%5Bvalue%5D=user%40example.com`, not `fields[email][value]=user@example.com`).
- **Alphabetical sorting** — the Payrexx docs and SDK do NOT sort parameters alphabetically. The signature input must match the body order.

### Fix — Single file: `supabase/functions/create-payrexx-gateway/index.ts`

Replace the signature + body construction logic:

1. Remove `buildQueryString` function entirely
2. Build `URLSearchParams` from params (this URL-encodes automatically)
3. Sign the `URLSearchParams.toString()` output (URL-encoded, no ApiSignature)
4. Append `ApiSignature` to the form data before sending

```text
Before:  queryString = buildQueryString(params)      → "amount=9000&currency=CHF&fields[email][value]=..."
         sign(queryString)                            → WRONG: not URL-encoded

After:   formData = new URLSearchParams(params)
         sign(formData.toString())                    → "amount=9000&currency=CHF&fields%5Bemail%5D%5Bvalue%5D=..."
         formData.append('ApiSignature', signature)   → CORRECT: matches what Payrexx expects
```

Additionally, the `errorResponse` for 500s sanitizes the real error message (returning "Ein interner Fehler ist aufgetreten..."). The function should return the actual Payrexx API error message when available, using status 502 (not 500) to avoid sanitization. This is already partially in place but needs the error path to use the Payrexx message directly.

---

## 2. Billing Workflow — How It Works

To answer your questions about how the subscription billing works, here is the complete existing workflow:

### Payment Flow
1. **Handwerker selects a plan** on `/checkout` or during registration
2. **If not yet approved**: Plan is saved as `pending_plan` in `handwerker_subscriptions`. No payment happens.
3. **After admin approval**: Handwerker receives an email with a Payrexx checkout link (via `send-pending-payment-reminder`).
4. **User clicks link** → redirected to Payrexx hosted payment page (TWINT, PostFinance, Visa/Mastercard).
5. **Payrexx sends webhook** to `payrexx-webhook` edge function with transaction result.
6. **On success**: Subscription activated, `payment_history` record created, confirmation email sent via `send-subscription-confirmation`.
7. **On failure**: User stays on free tier (or keeps existing paid plan if they had one), failure notification sent.

### Emails Sent to Handwerkers
- Subscription confirmation email (after successful payment)
- 7-day warning before expiry (renewal reminder or cancellation notice)
- Grace period renewal email (with Payrexx payment link, if not cancelled)
- Downgrade notification (after grace period expires without payment)
- Payment failure notification
- Payment reminders (48-72h and 7 days after approval if pending payment)

### Data Stored
- **`handwerker_subscriptions`**: Plan type, status, period dates, proposals used/limit, pending plan
- **`payment_history`**: Amount (in Rappen), currency, plan type, status, Payrexx transaction ID, payment date, invoice URL
- **`handwerker_notifications`**: In-app notifications for subscription events

### GDPR Compliance
- **No credit card data stored**: All payment data is handled by Payrexx (PCI DSS compliant Swiss provider). The platform only stores transaction IDs and amounts.
- **Data minimization**: Only essential billing data is stored (amount, date, plan type, transaction reference).
- **User access**: Handwerkers can view their payment history in Profile → "Rechnungen" tab.
- **Datenschutz page**: Already documents Payrexx as payment processor.
- **Data deletion**: The `delete-user` edge function handles complete user deletion including subscription and payment records.
- **Swiss hosting**: Payrexx is a Swiss company with Swiss data residency, aligning with Swiss data protection (DSG/nDSG).

The system is already well-structured for GDPR. No additional personal data beyond what Payrexx requires (email) is shared with the payment provider.

---

## Summary of Code Changes

| File | Change |
|------|--------|
| `supabase/functions/create-payrexx-gateway/index.ts` | Fix signature: sign URL-encoded form data instead of raw query string. Remove `buildQueryString`. Build form data first, sign its `.toString()`, then append signature. |

This is the only change needed. The webhook handler, subscription confirmation emails, and expiry checks are all working correctly once the gateway creation succeeds.

