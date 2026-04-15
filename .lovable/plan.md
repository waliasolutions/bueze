

# Fix: Clean up invalid phone data & add phone input validation

## Root Cause

All 26 profiles with `info@bueeze.ch` in the phone field were created on April 13, 2026 — likely via a bulk admin operation that accidentally put the company email into the phone field. The system has no input validation on phone fields, so any text (including email addresses) is accepted.

## Changes

### 1. Data cleanup — Clear the 26 invalid phone entries

Use the Supabase insert tool to run:
```sql
UPDATE profiles SET phone = NULL WHERE phone = 'info@bueeze.ch';
```

### 2. Add phone sanitization helper — `src/lib/displayFormatters.ts`

Add a `sanitizePhoneInput(value: string): string` function that strips all characters except digits, `+`, spaces, and parentheses. This becomes the SSOT for phone input filtering.

```typescript
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^0-9+\s()/-]/g, '');
}
```

### 3. Apply sanitization to all 5 phone input fields

| File | Field |
|------|-------|
| `src/pages/HandwerkerOnboarding.tsx` | phoneNumber |
| `src/pages/HandwerkerProfileEdit.tsx` | phoneNumber |
| `src/pages/SubmitLead.tsx` | phone (via zod field) |
| `src/components/admin/HandwerkerEditDialog.tsx` | phone_number |
| `src/pages/admin/HandwerkerApprovals.tsx` | phone_number |

Each `onChange` handler will pass the value through `sanitizePhoneInput()` before setting state — preventing letters, `@`, and other non-phone characters from being typed.

`AdminBillingSettings.tsx` phone field is excluded (company phone is admin-only internal config).

### 4. Add database-level CHECK constraint (migration)

```sql
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format_check
  CHECK (phone IS NULL OR phone ~ '^[0-9+\s()/-]+$');
```

This prevents any future invalid phone data at the DB level, regardless of which code path writes it.

**Files changed: 6 · New migration: 1 · Data update: 1**

