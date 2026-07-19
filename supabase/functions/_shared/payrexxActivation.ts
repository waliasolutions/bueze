// SSOT: Single activation pipeline for confirmed Payrexx transactions.
// Used by:
//   - payrexx-webhook        (realtime, primary path)
//   - verify-payrexx-payment (client-triggered fallback on /payment-success)
//   - admin_activate_subscription RPC (manual admin recovery — mirrors this pipeline in SQL)

//
// This function is fully idempotent — it can be safely called multiple times
// for the same transactionId. The payment_history table's unique constraint
// on payrexx_transaction_id is the source of truth for "already processed".

import { VALID_PLAN_AMOUNTS, PLAN_CONFIGS } from './planLabels.ts';
import { addMonths } from './dateFormatter.ts';

export interface PayrexxTransactionLike {
  id: string | number;
  status: string;
  referenceId?: string;
  amount?: number;
  invoice?: { currency?: string; paymentLink?: string } | null;
  subscription?: { id?: string | number } | null;
}

export interface ActivationResult {
  ok: boolean;
  activated: boolean;
  alreadyProcessed: boolean;
  isRenewal?: boolean;
  reason?: string;
  errorCode?:
    | 'invalid_reference_id'
    | 'unknown_plan_type'
    | 'invalid_amount'
    | 'invalid_currency'
    | 'not_confirmed'
    | 'subscription_update_failed';
}

/** Parse `{userId}|{planType}|{timestamp}` reference IDs (with hyphen legacy fallback). */
export function parseReferenceId(
  referenceId: string
): { userId: string; planType: string; timestamp: string } | null {
  if (!referenceId) return null;
  if (referenceId.includes('|')) {
    const parts = referenceId.split('|');
    if (parts.length !== 3) return null;
    return { userId: parts[0], planType: parts[1], timestamp: parts[2] };
  }
  const parts = referenceId.split('-');
  if (parts.length < 3) return null;
  const timestamp = parts.pop()!;
  const planType = parts.pop()!;
  const userId = parts.join('-');
  return { userId, planType, timestamp };
}

/**
 * Idempotently activate/renew a subscription from a confirmed Payrexx transaction.
 * Callers MUST verify the transaction against the Payrexx API before invoking this.
 */
export async function activateFromConfirmedTransaction(
  supabase: any,
  transaction: PayrexxTransactionLike,
  opts: { source: 'webhook' | 'verify' | 'reconcile' }
): Promise<ActivationResult> {
  const transactionId = transaction.id;
  const status = transaction.status;
  const referenceId = transaction.referenceId || '';
  const amount = transaction.amount !== undefined ? Number(transaction.amount) : undefined;
  const currency = transaction.invoice?.currency;
  const invoice = transaction.invoice;
  const subscriptionId = transaction.subscription?.id || null;

  if (status !== 'confirmed') {
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'not_confirmed', reason: `status=${status}` };
  }

  const parsed = parseReferenceId(referenceId);
  if (!parsed) {
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'invalid_reference_id', reason: `bad referenceId=${referenceId}` };
  }
  const { userId, planType } = parsed;

  if (!PLAN_CONFIGS[planType]) {
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'unknown_plan_type', reason: planType };
  }

  const validAmounts = VALID_PLAN_AMOUNTS[planType] || [];
  if (validAmounts.length > 0 && amount !== undefined && !validAmounts.includes(Number(amount))) {
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'invalid_amount', reason: `${amount} not in ${JSON.stringify(validAmounts)}` };
  }

  if (currency && currency.toUpperCase() !== 'CHF') {
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'invalid_currency', reason: currency };
  }

  const now = new Date();
  const planConfig = PLAN_CONFIGS[planType];
  const periodEnd = addMonths(now, planConfig.periodMonths);

  // IDEMPOTENCY GUARD: unique payrexx_transaction_id acts as the lock.
  // If the row already exists, no other work is performed.
  const { data: insertedPayment, error: insertError } = await supabase
    .from('payment_history')
    .upsert(
      {
        user_id: userId,
        amount,
        currency: (currency || 'CHF').toUpperCase(),
        plan_type: planType,
        status: 'paid',
        payment_provider: 'payrexx',
        payrexx_transaction_id: String(transactionId),
        payment_date: now.toISOString(),
        description: subscriptionId
          ? `Büeze ${planType} Abonnement (automatische Verlängerung)`
          : `Büeze ${planType} Abonnement`,
        invoice_pdf_url: invoice?.paymentLink || null,
      },
      { onConflict: 'payrexx_transaction_id', ignoreDuplicates: true }
    )
    .select('id');

  if (insertError) {
    return { ok: false, activated: false, alreadyProcessed: false, reason: `payment_history insert failed: ${insertError.message}` };
  }

  if (!insertedPayment || insertedPayment.length === 0) {
    console.log(`[payrexxActivation:${opts.source}] tx ${transactionId} already processed`);
    return { ok: true, activated: false, alreadyProcessed: true };
  }

  const paymentRowId = insertedPayment[0].id;

  // Detect auto-renewal to preserve auto_renew flag semantics
  const { data: existingSub } = await supabase
    .from('handwerker_subscriptions')
    .select('auto_renew, payrexx_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  const isRenewal = !!(existingSub?.auto_renew && existingSub?.payrexx_subscription_id && subscriptionId);

  const subscriptionData: Record<string, any> = {
    user_id: userId,
    plan_type: planType,
    status: 'active',
    proposals_limit: planConfig.proposalsLimit,
    proposals_used_this_period: 0,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    pending_plan: null,
    renewal_reminder_sent: false,
    payment_reminder_1_sent: false,
    payment_reminder_2_sent: false,
    updated_at: now.toISOString(),
  };

  if (subscriptionId) {
    subscriptionData.payrexx_subscription_id = String(subscriptionId);
    subscriptionData.auto_renew = true;
  }

  const { error: subError } = await supabase
    .from('handwerker_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });

  if (subError) {
    // Payment row is already in — flag for admin so recovery is trivial.
    await supabase.from('admin_notifications').insert({
      type: 'webhook_error',
      title: 'Abo-Aktivierung fehlgeschlagen',
      message: `Subscription-Update für User ${userId} fehlgeschlagen (source=${opts.source}). Zahlung erfasst, Abo NICHT aktiv. Transaction ${transactionId}.`,
      metadata: {
        payrexx_transaction_id: String(transactionId),
        reference_id: String(referenceId),
        user_id: userId,
        plan_type: planType,
        source: opts.source,
        error_message: String(subError.message || JSON.stringify(subError)).slice(0, 500),
        timestamp: new Date().toISOString(),
      },
    });
    return { ok: false, activated: false, alreadyProcessed: false, errorCode: 'subscription_update_failed', reason: subError.message };
  }

  // Best-effort side effects (never block activation)
  const planLabel = planType === 'monthly' ? 'monatliches' : planType === '6_month' ? '6-Monats' : 'Jahres';
  await supabase.from('handwerker_notifications').insert({
    user_id: userId,
    type: isRenewal ? 'subscription_renewed' : 'subscription_activated',
    title: isRenewal ? 'Abonnement verlängert' : 'Abonnement aktiviert',
    message: isRenewal
      ? `Ihr ${planLabel}-Abonnement wurde automatisch verlängert.`
      : `Ihr ${planLabel}-Abonnement wurde erfolgreich aktiviert.`,
    metadata: { planType, transactionId: String(transactionId), subscriptionId, isRenewal, source: opts.source },
  });

  try {
    await supabase.functions.invoke('send-subscription-confirmation', { body: { userId, planType } });
  } catch (e) {
    console.error(`[payrexxActivation:${opts.source}] send-subscription-confirmation failed`, e);
  }
  try {
    await supabase.functions.invoke('generate-invoice-pdf', {
      body: { paymentId: paymentRowId, userId, planType, amount },
    });
  } catch (e) {
    console.error(`[payrexxActivation:${opts.source}] generate-invoice-pdf failed`, e);
  }

  console.log(
    `[payrexxActivation:${opts.source}] ${isRenewal ? 'renewed' : 'activated'} user=${userId} plan=${planType} tx=${transactionId}`
  );
  return { ok: true, activated: true, alreadyProcessed: false, isRenewal };
}

/**
 * Fetch a transaction from the Payrexx API and, optionally, validate the fields
 * a caller claimed (webhook path). Returns the transaction object or an error.
 */
export async function fetchPayrexxTransaction(
  transactionId: string | number,
  expected?: { status?: string; amount?: number; referenceId?: string }
): Promise<{ ok: boolean; reason?: string; transaction?: PayrexxTransactionLike }> {
  const { generateSignature, normalizePayrexxInstance } = await import('./payrexxCrypto.ts');
  const apiKey = Deno.env.get('PAYREXX_API_KEY');
  const instanceRaw = Deno.env.get('PAYREXX_INSTANCE');
  if (!apiKey || !instanceRaw) {
    return { ok: false, reason: 'PAYREXX_API_KEY or PAYREXX_INSTANCE not configured' };
  }
  const instance = normalizePayrexxInstance(instanceRaw);
  try {
    const signature = await generateSignature('', apiKey);
    const url = `https://api.payrexx.com/v1.0/Transaction/${encodeURIComponent(String(transactionId))}/?instance=${encodeURIComponent(instance)}&ApiSignature=${encodeURIComponent(signature)}`;
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    if (res.status !== 200 || parsed?.status !== 'success' || !Array.isArray(parsed?.data) || parsed.data.length === 0) {
      return { ok: false, reason: `API lookup failed (HTTP ${res.status}): ${parsed?.message || text.substring(0, 200)}` };
    }
    const tx = parsed.data[0] as PayrexxTransactionLike;
    if (expected?.status && tx.status !== expected.status) {
      return { ok: false, reason: `status mismatch: api=${tx.status} claimed=${expected.status}`, transaction: tx };
    }
    if (expected?.amount !== undefined && Number(tx.amount) !== Number(expected.amount)) {
      return { ok: false, reason: `amount mismatch: api=${tx.amount} claimed=${expected.amount}`, transaction: tx };
    }
    if (expected?.referenceId && tx.referenceId !== expected.referenceId) {
      return { ok: false, reason: `referenceId mismatch: api=${tx.referenceId} claimed=${expected.referenceId}`, transaction: tx };
    }
    return { ok: true, transaction: tx };
  } catch (err) {
    return { ok: false, reason: `verification error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
