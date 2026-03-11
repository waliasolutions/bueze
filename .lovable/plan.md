

# Widen Admin Content Area

## Problem
The admin layout caps content width at `max-w-7xl` (1280px). Combined with the 224px sidebar, this wastes horizontal space on wide screens and truncates data-heavy pages like Handwerker management.

## Fix

### File: `src/components/admin/AdminLayout.tsx`

**Single change** — line 32: Replace `max-w-7xl mx-auto` with no max-width constraint, letting content fill the available space naturally.

```tsx
// Before
<div className="max-w-7xl mx-auto">

// After
<div>
```

This is the SSOT for all admin pages — all 14 admin pages render their content through `AdminLayout`, so this one change fixes every page uniformly. No other files need changes.

