

# DST Safety & SSOT Fixes — Final Plan

Both reviewer concerns verified and addressed. One table fix applied per feedback.

---

## Issue 1 — Fix `.setDate()` in 5 Edge Function files

Replace unsafe `.setDate(getDate() + N)` with DST-safe `addDays()` from `dateFormatter.ts`.

| File | Line | Change |
|------|------|--------|
| `_shared/profileHelpers.ts` | 149-150 | `addDays(new Date(), options.expiryDays \|\| 7)` — add import from `dateFormatter.ts` |
| `send-lead-notification/index.ts` | 206-207 | `addDays(new Date(), 7)` — already imports from `dateFormatter.ts` |
| `send-rating-reminder/index.ts` | 91-92 | `addDays(new Date(), 30)` — already imports from `dateFormatter.ts` |
| `guest-user-auto-create/index.ts` | 67-68 | `addDays(new Date(), 30)` — add import from `dateFormatter.ts` |
| `proposal-deadline-reminder/index.ts` | 127-128 | Covered by Issue 5 (DRY fix replaces this entirely) |

## Issue 2 — Fix `.setDate()` in 2 frontend files

| File | Line | Change |
|------|------|--------|
| `HandwerkerDashboard.tsx` | 835 | `addDays(new Date(subscriptionData.current_period_end), 1)` via date-fns |
| `useHandwerkerDocuments.ts` | 114-115 | `addDays(today, 30)` via date-fns |

## Issue 3 — Fix DST-unsafe helpers in `swissTime.ts`

All three helpers must wrap output with `fromZonedTime()` to return proper UTC instants:

- `startOfMonth`: `fromZonedTime(new Date(y, m, 1, 0, 0, 0, 0), SWISS_TIMEZONE)`
- `endOfMonth`: `fromZonedTime(new Date(y, m+1, 0, 23, 59, 59, 999), SWISS_TIMEZONE)`
- `addMonths`: `fromZonedTime(dfnsAddMonths(toSwissTime(date), months), SWISS_TIMEZONE)`

## Issue 4 — Admin pages bypass Swiss-timezone SSOT

Replace date-fns `startOfMonth`/`endOfMonth` imports with `@/lib/swissTime` equivalents. Remove dead `subMonths` import in AdminPayments.

| File | Change |
|------|--------|
| `AdminPayments.tsx` | Import from `@/lib/swissTime`, remove dead `subMonths` |
| `AdminInvoices.tsx` | Import from `@/lib/swissTime` |

## Issue 5 — DRY: Use `createMagicToken()` in `proposal-deadline-reminder`

Replace inline magic-token creation (lines 126-138) with `createMagicToken()` from `profileHelpers.ts`. Inherits DST fix from Issue 1. Batch token creation in `send-lead-notification` and `send-rating-reminder` intentionally kept inline to avoid N+1 inserts.

---

## Summary

| # | Issue | Files | Fix |
|---|-------|-------|-----|
| 1 | `.setDate()` in Edge Functions | profileHelpers, send-lead-notification, send-rating-reminder, guest-user-auto-create, proposal-deadline-reminder | `addDays()` from `dateFormatter.ts` |
| 2 | `.setDate()` in frontend | HandwerkerDashboard, useHandwerkerDocuments | `addDays()` from `date-fns` |
| 3 | DST-unsafe helpers in swissTime.ts | swissTime.ts | Wrap output with `fromZonedTime(…, SWISS_TIMEZONE)` |
| 4 | Admin SSOT bypass | AdminPayments, AdminInvoices | Import from `@/lib/swissTime` instead of `date-fns` |
| 5 | DRY magic-token | proposal-deadline-reminder | Replace with `createMagicToken()` from `profileHelpers.ts` |

**Files changed: 9 · New files: 0 · Migrations: 0 · No breaking changes**

