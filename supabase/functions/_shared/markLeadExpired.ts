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
 *
 * NOTE: the pre-check narrows but does NOT close the race between concurrent
 * invocations (cron + admin force-click in the same second). A unique partial
 * index on client_notifications(user_id, type, related_id) WHERE type='lead_expired'
 * would close it; intentionally out of scope. Duplicate is admin-visible and rare.
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
