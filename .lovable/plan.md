

# Deep QA Report: Account Health & Edge Cases

## Findings Summary

### Critical Issue: User Deletion FK Bug (amit.walia@gmx.ch)

The `delete-user` Edge Function fails to delete auth users when the user has **accepted proposals**. Root cause:

```text
leads.accepted_proposal_id → lead_proposals.id (FK constraint)

Current order:
  1. Delete lead_proposals ← FAILS silently (FK from leads blocks it)
  2. Delete leads (only owner_id match)
  3. Delete auth user ← FAILS (cascade hits the same FK)
```

The function must **NULL out `leads.accepted_proposal_id`** before deleting proposals, and also delete leads where the user's proposals were accepted (not just owned leads).

**amit.walia status**: All public data was deleted successfully, but the auth user (`4d5b0b6e-7df0-4f08-b986-48f9655364c3`) remains orphaned. 4 leads still reference his proposals via `accepted_proposal_id`.

### Minor Issue: 3 Handwerkers Missing 'user' Role

These approved handwerkers only have the `handwerker` role but not the default `user` role (all others have both). Not functionally breaking, but inconsistent:

- Arben Mulaj (info@mhs-ht.ch)
- Oleh Babii (haushelferservice@gmail.com)  
- Barbara Lani (info@fsg-zuerisee.ch)

### Confirmed Working

- **Manuel Akin**: Subscription now exists (free, active). Auth, profile, roles, subscription all intact.
- **All other handwerkers**: Have profile + roles + subscription + approved status. No orphaned data.
- **Admin accounts**: 2 super_admins (info@bueeze.ch, info@walia-solutions.ch) correctly configured.
- **No guest registrations** remain (all resolved to full users).
- **No orphaned subscriptions/roles** without matching profiles.

### Cleanup Candidates

10 test/junk accounts exist in profiles (asdf@asdf.ch, test@test.ch variants, etc.). Non-blocking but clutter.

---

## Plan

### 1. Fix delete-user Edge Function

Add two steps before the existing proposal deletion (step 5):

```typescript
// 4a. Clear accepted_proposal_id on leads that reference this user's proposals
await supabase
  .from('leads')
  .update({ accepted_proposal_id: null })
  .in('accepted_proposal_id', 
    /* subquery: proposal IDs by this handwerker */
  );

// 4b. Delete leads where this user's proposal was accepted (but user doesn't own the lead)
// Already handled by nullifying the FK above
```

Since Supabase JS doesn't support subqueries in `.in()`, we'll first fetch the user's proposal IDs, then use those to clear the FK.

### 2. Migration: Clean up amit.walia orphan + fix 3 missing roles

SQL migration to:
- NULL out `leads.accepted_proposal_id` for the 4 leads referencing amit's proposals
- Delete the remaining `lead_proposals` for amit
- Insert missing `user` role for the 3 handwerkers

### 3. Re-attempt amit.walia auth deletion

After the FK references are cleared, the Edge Function can be called again (or manual deletion via Supabase Dashboard).

