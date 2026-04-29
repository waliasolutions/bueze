# Plan v3: 10-day age guard for `send-lead-notification`

All review feedback applied. Three files touched, one new shared helper, no SQL.

---

## 1. NEW: `supabase/functions/_shared/markLeadExpired.ts`

Single source of truth for the expiration transition. Used by both the pre-blast guard and the daily cron.

```ts
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

interface MinimalLead {
  id: string;
  title: string;
  owner_id: string;
}

/**
 * Idempotently transition a lead to 'expired' and notify the owner once.
 *
 * - Status update is filtered by status='active' (no-op if already expired).
 * - Notification insert is gated by a pre-check on (user_id, type, related_id).
 *   NOTE: the pre-check narrows but does NOT close the race between concurrent
 *   invocations (cron + admin force-click in the same second). A unique partial
 *   index on client_notifications(user_id, type, related_id) WHERE type='lead_expired'
 *   would close it; intentionally out of scope here. Duplicate is admin-visible
 *   and rare — accepted trade-off.
 */
export async function markLeadExpired(
  supabase: SupabaseClient,
  lead: MinimalLead,
  reason: string,
): Promise<{ statusChanged: boolean; notified: boolean }> {
  const { data: updated } = await supabase
    .from('leads')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('id', lead.id)
    .eq('status', 'active')
    .select('id');

  const statusChanged = (updated?.length ?? 0) > 0;

  const { data: existing } = await supabase
    .from('client_notifications')
    .select('id')
    .eq('user_id', lead.owner_id)
    .eq('type', 'lead_expired')
    .eq('related_id', lead.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { statusChanged, notified: false };
  }

  await supabase.from('client_notifications').insert({
    user_id: lead.owner_id,
    type: 'lead_expired',
    title: 'Auftrag abgelaufen',
    message: `Die Angebotsfrist für "${lead.title}" ist abgelaufen.`,
    related_id: lead.id,
    metadata: { lead_title: lead.title, reason },
  });

  return { statusChanged, notified: true };
}
```

No `LEAD_DEADLINE_DAYS` export. Dead code stays out. (The `10` lives once in the SQL trigger; the TS side trusts the column.)

---

## 2. `supabase/functions/send-lead-notification/index.ts`

**a)** Accept `force` flag at the body parse:
```ts
const { leadId, force } = await req.json();
```

**b)** Add `proposal_deadline` to the lead SELECT:
```ts
.select('id, title, description, category, city, canton, zip, budget_min, budget_max, urgency, owner_id, created_at, proposal_deadline')
```

**c)** Add the import and the guard block immediately after the lead is fetched, before the admin email:

```ts
import { markLeadExpired } from '../_shared/markLeadExpired.ts';

// Drift detection: NOT bypassable by force. The trigger guarantees this column;
// null means schema/trigger drift and we want it surfaced loudly.
if (!lead.proposal_deadline) {
  throw new Error(`Lead ${leadId} has no proposal_deadline — trigger drift detected`);
}

// Age guard: bypassable by admin "Re-notify" button via force=true.
if (!force && new Date(lead.proposal_deadline).getTime() < Date.now()) {
  console.warn(`[send-lead-notification] Lead ${leadId} deadline passed (${lead.proposal_deadline}). Skipping notifications.`);
  const result = await markLeadExpired(supabase, lead, 'activated_after_deadline');
  return successResponse({
    success: true,
    skipped: true,
    reason: 'deadline_passed',
    ...result,
  });
}
```

The null-check sits **outside** the `!force` block — admin retry on a drift-broken lead surfaces the error instead of silently blasting emails.

---

## 3. `supabase/functions/lead-expiry-check/index.ts`

Replace the inline bulk update + bulk client_notifications insert (currently lines ~52–85) with per-lead `markLeadExpired` calls inside the existing iteration.

```ts
import { markLeadExpired } from '../_shared/markLeadExpired.ts';

// ... after fetching expiredLeads ...

let expiredCount = 0;
for (const lead of expiredLeads) {
  const { statusChanged } = await markLeadExpired(supabase, lead, 'deadline_passed_cron');
  if (statusChanged) expiredCount++;
}
```

The handwerker-side notifications + proposal `withdrawn` updates (separate concern) stay untouched.

---

## 4. `src/pages/admin/AdminLeadsManagement.tsx` (line 212)

Pass `force: true` so admin manual retry bypasses the age guard:

```ts
const { data, error: invokeError } = await supabase.functions.invoke('send-lead-notification', {
  body: { leadId, force: true },
});
```

---

## Verification

1. **Stale lead activated:** Edge logs show skip warning, status flips to `expired`, owner gets exactly one `lead_expired` notification, no handwerker emails sent.
2. **Cron + edge race (best-effort):** Manual invoke after cron expired the lead → status update no-ops, pre-check finds existing notification, returns `{statusChanged:false, notified:false}`. No duplicate row in the common case.
3. **Admin force on stale lead:** Emails go out regardless of age.
4. **Admin force on drift-broken lead (no proposal_deadline):** Throws clear error. Admin sees the failure instead of phantom blast.
5. **Cron path:** Same set of leads expired, owners notified once, behavior unchanged.

## Out of scope (follow-up backlog, NOT in this change)

- Unique partial index on `client_notifications(user_id, type, related_id) WHERE type='lead_expired'` to close the concurrent-insert race.
- Propagating the 10-day constant from SQL trigger to TS (currently SQL-only SSOT).
- Lead notification audit log.
- Showing expiration reason in client UI.
