

# Admin Edit: Handwerker Address & Contact Details

## Problem
Admins can view handwerker profiles but cannot edit address or contact details directly. Currently the only edit path is the handwerker's own profile edit page.

## Approach
Add an inline edit dialog triggered from the handwerker table row. This keeps the management page clean while giving admins quick access to edit the key fields.

## Implementation

**New component:** `src/components/admin/HandwerkerEditDialog.tsx`

A Dialog component that:
- Receives a `Handwerker` object and an `onSaved` callback
- Presents editable fields grouped into two sections:
  - **Contact**: `first_name`, `last_name`, `email`, `phone_number`, `company_name`
  - **Business Address**: `business_address`, `business_zip`, `business_city`, `business_canton` (canton via Select from `SWISS_CANTONS` SSOT)
- On save, updates `handwerker_profiles` via Supabase and calls `onSaved()` to refresh the list
- Uses existing UI components only (Dialog, Input, Label, Select, Button) — no new dependencies

**Modified file:** `src/pages/admin/HandwerkerManagement.tsx`

- Add `business_address`, `business_zip` to the `Handwerker` interface (already fetched via `select('*')` but not typed)
- Add an Edit (Pencil) icon button in the actions column next to Eye
- State: `editingHandwerker` to control the dialog
- Import and render `HandwerkerEditDialog`
- On save callback: call existing `fetchHandwerkers()` to refresh

| Area | Change |
|------|--------|
| New component | `HandwerkerEditDialog` — ~80 lines, reuses existing UI primitives and `SWISS_CANTONS` |
| HandwerkerManagement | Add 2 fields to interface, 1 button, 1 state variable, dialog render |
| SSOT | Canton list from `@/config/cantons`, field names match DB columns exactly |

No new dependencies, no duplicated logic, no new pages or routes.

