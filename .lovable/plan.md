

# Deep QA: Email Infrastructure Audit

## Summary

Reviewed all 23 Edge Functions that send emails. **One critical issue found, plus one minor concern.**

---

## Issue 1 (CRITICAL): `reset-user-password` uses Resend API — emails never send

**File:** `supabase/functions/reset-user-password/index.ts` (lines 80-115)

This function tries to send password reset emails via **Resend API** (`https://api.resend.com/emails`) using a `RESEND_API_KEY` environment variable. However:
- There is **no `RESEND_API_KEY` secret** configured in the project (checked secrets list)
- Every other email function uses the shared `sendEmail()` from `smtp2go.ts`
- The function silently swallows the failure (catch block on line 116 doesn't throw)

**Result:** When an admin resets a user's password, the password IS changed successfully, but the email with the new credentials is **never sent**. The user has no way to know their new password.

**Fix:** Replace the Resend API call with `sendEmail()` from `smtp2go.ts`, matching the pattern used by all other functions. Use the shared `emailWrapper` for consistent branding.

---

## Issue 2 (MINOR): `send-password-reset` — `listUsers()` fetches ALL users

**File:** `supabase/functions/send-password-reset/index.ts` (line 33)

```typescript
const { data: userData } = await supabase.auth.admin.listUsers();
const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
```

This loads the entire user list into memory to find one user. Not an email-sending bug, but will degrade as the user base grows. Not blocking — noting for future optimization.

---

## All Other Functions: OK

The remaining 22 email-sending functions all correctly:
- Import `sendEmail` from `../_shared/smtp2go.ts`
- Which imports `EMAIL_SENDER` from `../_shared/siteConfig.ts`
- Use consistent error handling and logging
- SMTP2GO secret is configured ✓

Functions verified:
- `send-acceptance-emails` ✓
- `send-admin-registration-notification` ✓
- `send-approval-email` ✓
- `send-delivery-emails` ✓
- `send-handwerker-credentials` ✓
- `send-invoice-email` ✓
- `send-lead-notification` ✓
- `send-message-notification` ✓
- `send-password-reset` ✓ (uses smtp2go correctly)
- `send-pending-payment-reminder` ✓
- `send-proposal-notification` ✓
- `send-proposal-rejection-email` ✓
- `send-rating-notification` ✓
- `send-rating-reminder` ✓
- `send-rating-response-notification` ✓
- `send-rejection-email` ✓
- `send-subscription-confirmation` ✓
- `check-subscription-expiry` ✓
- `create-handwerker-account` ✓
- `create-handwerker-self-registration` ✓
- `document-expiry-reminder` ✓
- `guest-user-auto-create` ✓

---

## Plan

### Fix `reset-user-password/index.ts`
1. Remove the Resend API code (lines 80-118)
2. Import `sendEmail` from `smtp2go.ts` and `emailWrapper` from `emailTemplates.ts`
3. Replace with a `sendEmail()` call using the same branded HTML template pattern
4. Remove the unused `EMAIL_SENDER` import (no longer needed directly)

One file changed, ~30 lines modified.

