

# Plan: Add Visible Validation Error Feedback on Submit Failure

## Context
The B1 schema fix is already deployed. But the root UX problem remains: when `form.handleSubmit` fails validation, the user sees nothing — no toast, no error summary. React Hook Form silently prevents submission. This affected real users on March 5th.

## What to Change

**File**: `src/pages/SubmitLead.tsx`

Add an `onInvalid` callback to `form.handleSubmit` that shows a toast with the validation errors:

```tsx
<form onSubmit={form.handleSubmit(onSubmit, (errors) => {
  const errorCount = Object.keys(errors).length;
  toast({
    title: 'Formular unvollständig',
    description: `Bitte überprüfen Sie ${errorCount} ${errorCount === 1 ? 'Feld' : 'Felder'}.`,
    variant: 'destructive',
  });
  console.error('[SubmitLead] Validation errors:', errors);
})} className="space-y-6">
```

This is the second argument to `handleSubmit` — React Hook Form calls it when validation fails. Currently it's not used, so failures are silent.

## What This Fixes
- Users always get feedback when submit fails
- Console log captures the exact failing fields for debugging
- No architectural changes, no new components — single line addition

## Operational Task (Not Code)
Contact affected users (`dedonno@yahoo.com`, `putzwind@yahoo.com`, `info@wp-24.ch`, `highdent@gmx.ch`) to inform them the issue is resolved and invite them to retry.

