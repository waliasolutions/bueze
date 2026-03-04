

# Root Cause: `proposals_count` Only Increments, Never Decrements

The `proposals_count` column on the `leads` table is maintained by a database trigger (`trigger_send_proposal_notification`) that runs `proposals_count = proposals_count + 1` on every INSERT into `lead_proposals`. However, **no trigger decrements the count** when a proposal is withdrawn.

So if a lead received 2 proposals and one was withdrawn, `proposals_count` still shows 2 — even though only 1 active proposal exists.

The Dashboard tab label reads: `Erhaltene Offerten ({myLeads.reduce((sum, lead) => sum + (lead.proposals_count || 0), 0)})` — pulling directly from this stale counter.

## Fix

**Replace the stale counter with a live count.** Two options — I recommend Option A for correctness and SSOT:

### Option A — Compute count from actual proposals (recommended)

In `src/pages/Dashboard.tsx`, after fetching `myLeads`, fetch the actual proposal counts per lead from `lead_proposals` where `status NOT IN ('withdrawn', 'rejected')` and use those counts instead of `lead.proposals_count`.

This means:
1. Add a second query in the Dashboard's data fetch: select `lead_id, count(*)` from `lead_proposals` grouped by `lead_id`, filtered to only `pending` and `accepted` statuses, for the user's lead IDs.
2. Merge these counts into the lead objects.
3. The tab badge and per-card count will now reflect reality.

### Option B — Fix the database trigger (requires migration)

Add an UPDATE trigger on `lead_proposals` that decrements `proposals_count` when status changes to `withdrawn`. This fixes the root cause at the DB level but requires a migration AND a one-time data fix for existing stale counts.

## Recommended: Option A

Simpler, no migration needed, self-correcting, and follows the principle of computing derived data rather than caching it.

### Changes — single file: `src/pages/Dashboard.tsx`

1. After fetching leads, query `lead_proposals` for active proposal counts grouped by `lead_id` (status in `pending`, `accepted`).
2. Override each lead's `proposals_count` with the live count.
3. No other files need changes — the display logic already reads `proposals_count`.

