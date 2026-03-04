

# Remove profile view icon for pending Handwerker

## Problem
In `HandwerkerManagement.tsx`, the Eye icon ("Profil anzeigen") is shown for all handwerkers including those with `verification_status === 'pending'`. Since pending handwerkers don't have a viewable public profile, this button is non-functional for them.

## Change
In `src/pages/admin/HandwerkerManagement.tsx` (lines 700-708), wrap the Eye button in a condition that excludes pending handwerkers:

```tsx
// Before (line 701-708): Eye button shown for ALL
<Button variant="ghost" size="icon" onClick={...} title="Profil anzeigen">
  <Eye className="h-4 w-4" />
</Button>

// After: Only show for non-pending
{h.verification_status !== 'pending' && (
  <Button variant="ghost" size="icon" onClick={...} title="Profil anzeigen">
    <Eye className="h-4 w-4" />
  </Button>
)}
```

This is a single-line conditional addition. No other files reference this pattern — the `HandwerkerApprovals.tsx` page (which only shows pending handwerkers) does not have an Eye/profile-view icon at all, so there's no duplication concern.

## SSOT/DRY check
- The `verification_status` field is the single source of truth for handwerker state
- No other admin page shows a profile-view icon for pending handwerkers
- The `HandwerkerProfileModal` component remains unchanged — it simply won't be triggered for pending entries

