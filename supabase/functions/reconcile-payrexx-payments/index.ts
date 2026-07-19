// Scheduled safety net: activate paid subscriptions that BOTH the webhook and
// the /payment-success client fallback missed (e.g. Payrexx API briefly down
// during the webhook while the user closed the tab before redirecting back).
// Runs through the SAME shared activation pipeline as webhook/verify, so it is
// idempotent and can also repair "payment recorded but subscription inactive"
// states (see _shared/payrexxActivation.ts).
//
// Defaults to DRY-RUN: reports what it would do without writing anything.
// Pass { "live": true } (or ?live=true) to actually activate.
//
// Deployment checklist (cannot be done from the repo):
//   1. Set the CRON_SECRET function secret in the Supabase dashboard.
//   2. Schedule hourly via dashboard cron (pg_cron + pg_net POST) sending
//      header `x-cron-secret: <CRON_SECRET>` and body {"live": true}.

import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { generateSignature, normalizePayrexxInstance } from '../_shared/payrexxCrypto.ts';
import {
  activateFromConfirmedTransaction,
  fetchPayrexxTransaction,
  parseReferenceId,
  type PayrexxTransactionLike,
} from '../_shared/payrexxActivation.ts';
import { PLAN_CONFIGS } from '../_shared/planLabels.ts';
import { addMonths } from '../_shared/dateFormatter.ts';

const DEFAULT_LOOKBACK_DAYS = 7;
const PAGE_SIZE = 100;
const MAX_PAGES = 3;

interface ListedTransaction extends PayrexxTransactionLike {
  time?: string;
  createdAt?: string | number;
}

/** Fetch one page of the Payrexx transaction list (newest first). */
async function fetchTransactionPage(offset: number): Promise<ListedTransaction[] | null> {
  const apiKey = Deno.env.get('PAYREXX_API_KEY');
  const instanceRaw = Deno.env.get('PAYREXX_INSTANCE');
  if (!apiKey || !instanceRaw) return null;
  const instance = normalizePayrexxInstance(instanceRaw);

  // Payrexx signs GET requests over the url-encoded filter params.
  const params = `limit=${PAGE_SIZE}&offset=${offset}`;
  const signedUrl = `https://api.payrexx.com/v1.0/Transaction/?${params}&instance=${encodeURIComponent(instance)}&ApiSignature=${encodeURIComponent(await generateSignature(params, apiKey))}`;
  let res = await fetch(signedUrl, { method: 'GET', headers: { Accept: 'application/json' } });
  let parsed = res.ok ? await res.json().catch(() => null) : null;

  if (parsed?.status !== 'success' || !Array.isArray(parsed?.data)) {
    // Fallback to the parameterless call known to work in verify-payrexx-payment
    // (returns the most recent transactions). Only useful for the first page.
    if (offset > 0) return null;
    const plainUrl = `https://api.payrexx.com/v1.0/Transaction/?instance=${encodeURIComponent(instance)}&ApiSignature=${encodeURIComponent(await generateSignature('', apiKey))}`;
    res = await fetch(plainUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    parsed = res.ok ? await res.json().catch(() => null) : null;
    if (parsed?.status !== 'success' || !Array.isArray(parsed?.data)) return null;
  }
  return parsed.data as ListedTransaction[];
}

function transactionTime(tx: ListedTransaction): Date | null {
  const raw = tx.time ?? tx.createdAt;
  if (raw === undefined || raw === null) return null;
  const d = typeof raw === 'number' ? new Date(raw * 1000) : new Date(String(raw).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return errorResponse('CRON_SECRET is not configured', 500);
  }
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({} as any)) : ({} as any);
    const live = body.live === true || url.searchParams.get('live') === 'true';
    const lookbackDays = Number(body.days ?? url.searchParams.get('days')) || DEFAULT_LOOKBACK_DAYS;
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    // 1. Collect recent confirmed subscription transactions from Payrexx.
    const candidates: ListedTransaction[] = [];
    let checked = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const list = await fetchTransactionPage(page * PAGE_SIZE);
      if (!list) {
        if (page === 0) return errorResponse('Payrexx transaction list unavailable', 502);
        break;
      }
      checked += list.length;
      let pageHasRecent = false;
      for (const tx of list) {
        const time = transactionTime(tx);
        const isRecent = !time || time >= cutoff;
        if (isRecent) pageHasRecent = true;
        if (!isRecent) continue;
        if (tx.status !== 'confirmed') continue;
        const parsed = parseReferenceId(String(tx.referenceId || ''));
        if (!parsed || !PLAN_CONFIGS[parsed.planType]) continue;
        candidates.push(tx);
      }
      if (list.length < PAGE_SIZE || !pageHasRecent) break;
    }

    const supabase = createSupabaseAdmin();
    const candidateIds = candidates.map((tx) => String(tx.id));

    // 2. Split into unprocessed vs processed-but-possibly-stuck.
    const processedRows = candidateIds.length
      ? (
          await supabase
            .from('payment_history')
            .select('payrexx_transaction_id, user_id, plan_type, payment_date, status')
            .in('payrexx_transaction_id', candidateIds)
        ).data || []
      : [];
    const processedById = new Map<string, any>(processedRows.map((r: any) => [String(r.payrexx_transaction_id), r]));

    const userIds = [...new Set(processedRows.map((r: any) => r.user_id))];
    const subRows = userIds.length
      ? (
          await supabase
            .from('handwerker_subscriptions')
            .select('user_id, plan_type, status, current_period_end')
            .in('user_id', userIds)
        ).data || []
      : [];
    const subByUser = new Map<string, any>(subRows.map((s: any) => [s.user_id, s]));

    const toProcess: { tx: ListedTransaction; reason: 'unprocessed' | 'stuck' }[] = [];
    let alreadyProcessed = 0;
    for (const tx of candidates) {
      const payment = processedById.get(String(tx.id));
      if (!payment) {
        toProcess.push({ tx, reason: 'unprocessed' });
        continue;
      }
      // Pre-screen for the stuck "paid but not active" state; the activation
      // pipeline re-checks precisely (incl. newest-payment-wins) before writing.
      const sub = subByUser.get(payment.user_id);
      const planConfig = PLAN_CONFIGS[payment.plan_type];
      const expectedEnd = planConfig ? addMonths(new Date(payment.payment_date), planConfig.periodMonths) : null;
      const looksHealthy =
        payment.status !== 'paid' ||
        !expectedEnd ||
        (sub &&
          sub.status === 'active' &&
          sub.plan_type === payment.plan_type &&
          sub.current_period_end &&
          new Date(sub.current_period_end).getTime() >= expectedEnd.getTime() - 60_000);
      if (looksHealthy) {
        alreadyProcessed++;
      } else {
        toProcess.push({ tx, reason: 'stuck' });
      }
    }

    const wouldActivate = toProcess.map(({ tx, reason }) => {
      const parsed = parseReferenceId(String(tx.referenceId || ''))!;
      return { transactionId: String(tx.id), userId: parsed.userId, planType: parsed.planType, amount: tx.amount, reason };
    });

    if (!live) {
      console.log(`[reconcile-payrexx-payments] dry-run: checked=${checked} candidates=${candidates.length} wouldActivate=${wouldActivate.length}`);
      return successResponse({ dryRun: true, checked, candidates: candidates.length, alreadyProcessed, wouldActivate, failures: [] });
    }

    // 3. Live: re-fetch each transaction fresh from the API, then run the
    //    shared idempotent activation pipeline.
    const activated: typeof wouldActivate = [];
    const failures: { transactionId: string; reason: string }[] = [];
    for (const { tx, reason } of toProcess) {
      const verification = await fetchPayrexxTransaction(tx.id);
      if (!verification.ok || !verification.transaction) {
        failures.push({ transactionId: String(tx.id), reason: verification.reason || 'lookup_failed' });
        continue;
      }
      const result = await activateFromConfirmedTransaction(supabase, verification.transaction, { source: 'reconcile' });
      if (result.activated) {
        const parsed = parseReferenceId(String(verification.transaction.referenceId || ''))!;
        activated.push({ transactionId: String(tx.id), userId: parsed.userId, planType: parsed.planType, amount: verification.transaction.amount, reason });
        // Reconcile catching an activation means webhook AND verify both
        // failed for this payment — worth a human look at why.
        await supabase.from('admin_notifications').insert({
          type: 'reconcile_activation',
          title: 'Abo durch Reconcile aktiviert',
          message: `Zahlung ${tx.id} wurde erst durch den Reconcile-Lauf aktiviert (${reason}). Webhook und Verify-Fallback haben diese Zahlung verpasst.`,
          metadata: { payrexx_transaction_id: String(tx.id), user_id: parsed.userId, plan_type: parsed.planType, reason },
        });
      } else if (!result.ok) {
        failures.push({ transactionId: String(tx.id), reason: result.reason || result.errorCode || 'activation_failed' });
      } else {
        alreadyProcessed++;
      }
    }

    console.log(`[reconcile-payrexx-payments] live: checked=${checked} activated=${activated.length} failures=${failures.length}`);
    return successResponse({ dryRun: false, checked, candidates: candidates.length, alreadyProcessed, activated, failures });
  } catch (error) {
    console.error('[reconcile-payrexx-payments] error', error);
    return errorResponse(error instanceof Error ? error.message : String(error), 500);
  }
});
