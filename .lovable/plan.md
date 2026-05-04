# Resend to Non-Proposers — Admin Button

Implements the manual half of the approved 3-day re-send plan. The 3-day cron orchestrator can reuse the same edge-function flag later.

## 1. Edge function: `send-lead-notification`

Add two optional flags to the request body. All matching/email logic stays SSOT here.

- `excludeProposers: boolean` — when true, fetch `lead_proposals.handwerker_id` for the lead and remove those user_ids from `matchingHandwerkers` before token creation and email sending.
- `skipAdminEmail: boolean` — when true, skip the admin "Neuer Auftrag" email (resends shouldn't re-spam admin).

```text
parse body → { leadId, force, excludeProposers, skipAdminEmail }
... existing lead fetch + deadline guards ...
if (!skipAdminEmail) { send admin email }
... existing matching produces matchingHandwerkers ...
if (excludeProposers) {
  const { data: existing } = await supabase
    .from('lead_proposals')
    .select('handwerker_id')
    .eq('lead_id', leadId);
  const proposerIds = new Set((existing||[]).map(p => p.handwerker_id));
  matchingHandwerkers = matchingHandwerkers.filter(h => !proposerIds.has(h.user_id));
  console.log(`[send-lead-notification] After excluding ${proposerIds.size} proposers: ${matchingHandwerkers.length} remain`);
}
... existing token batch + email loop unchanged ...
```

Response payload unchanged (`successCount`, `errorCount`, `matchingHandwerkersCount`).

## 2. Admin UI: `src/pages/admin/AdminLeadsManagement.tsx`

A separate `BellRing` icon button next to the existing `Bell` (full re-notify), shown only on `status === 'active'` leads.

State:
- Reuse the existing `actionType` union — extend with `'resend_nonproposers'`.
- Reuse `renotifyLoading` for spinner state (single in-flight per lead is fine).

Handler:
```ts
const handleResendNonProposers = async (leadId: string) => {
  setRenotifyLoading(leadId);
  try {
    const { data, error } = await supabase.functions.invoke('send-lead-notification', {
      body: { leadId, force: true, excludeProposers: true, skipAdminEmail: true },
    });
    if (error) throw new Error(error.message);
    toast.success(`${data?.successCount ?? 0} Handwerker ohne Offerte erneut benachrichtigt.`);
  } catch (e: any) {
    toast.error(e.message || 'Fehler beim erneuten Versand.');
  } finally {
    setRenotifyLoading(null);
    setShowActionDialog(false);
    setActionLead(null);
  }
};
```

Wire `executeLeadAction` to dispatch to it when `actionType === 'resend_nonproposers'`, and add a case to `getActionDialogContent`:

```text
title: 'An Nicht-Bietende erneut senden'
description: 'Sendet die Lead-Benachrichtigung erneut an alle passenden Handwerker, die noch keine Offerte eingereicht haben. Bestehende Bieter werden NICHT erneut kontaktiert.'
actionLabel: 'Erneut senden'
```

Button (placed right after the existing renotify button, ~line 572):
```tsx
{lead.status === 'active' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleLeadAction(lead, 'resend_nonproposers')}
    title="An Nicht-Bietende erneut senden"
    disabled={renotifyLoading === lead.id}
  >
    <BellRing className="h-4 w-4 text-warning" />
  </Button>
)}
```

Add `BellRing` to the lucide-react import on line 35.

## 3. Out of scope (already approved separately)

- The `lead-3day-resend` cron orchestrator — will be built in a follow-up; it will simply call this edge function with `{ excludeProposers: true, skipAdminEmail: true }` for each eligible lead.

## Verification

1. Active lead with 0 proposals → button sends to all matched handwerkers; toast shows count.
2. Active lead with N proposals → button sends to (matched − N); proposers receive nothing (verify via edge function logs: "After excluding N proposers").
3. No admin "Neuer Auftrag" email arrives on resend (check SUPPORT_EMAIL inbox / SMTP2GO logs).
4. Confirmation modal appears before send; Cancel aborts; spinner replaces icon during invoke.
