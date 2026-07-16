// On-demand fallback: activate subscription without waiting for the Payrexx webhook.
// Called by the /payment-success page immediately after redirect from Payrexx.
// Uses the SAME shared activation pipeline as the webhook, so behaviour never drifts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import {
  activateFromConfirmedTransaction,
  fetchPayrexxTransaction,
} from '../_shared/payrexxActivation.ts';
import { generateSignature, normalizePayrexxInstance } from '../_shared/payrexxCrypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Look up recent Payrexx transactions and find one matching the given referenceId.
 * Used when the /payment-success redirect only carries the referenceId (not the tx id).
 */
async function findTransactionByReference(referenceId: string): Promise<{ id: string | number } | null> {
  const apiKey = Deno.env.get('PAYREXX_API_KEY');
  const instanceRaw = Deno.env.get('PAYREXX_INSTANCE');
  if (!apiKey || !instanceRaw) return null;
  const instance = normalizePayrexxInstance(instanceRaw);
  const signature = await generateSignature('', apiKey);
  const url = `https://api.payrexx.com/v1.0/Transaction/?instance=${encodeURIComponent(instance)}&ApiSignature=${encodeURIComponent(signature)}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const parsed = await res.json().catch(() => null);
  if (parsed?.status !== 'success' || !Array.isArray(parsed?.data)) return null;
  // Newest first — Payrexx returns in creation order; scan for the match.
  const match = parsed.data.find((t: any) => t?.referenceId === referenceId);
  return match ? { id: match.id } : null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Require an authenticated caller so this endpoint can't be spammed by strangers.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return errorResponse('Unauthorized', 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return errorResponse('Unauthorized', 401);
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({} as any));
    const transactionIdInput: string | number | undefined = body.transactionId ?? body.transaction_id;
    const referenceIdInput: string | undefined = body.referenceId ?? body.reference_id;

    if (!transactionIdInput && !referenceIdInput) {
      return errorResponse('transactionId or referenceId required', 400);
    }

    let transactionId = transactionIdInput;
    if (!transactionId && referenceIdInput) {
      const found = await findTransactionByReference(referenceIdInput);
      if (!found) {
        return successResponse({ ok: false, reason: 'transaction_not_found' });
      }
      transactionId = found.id;
    }

    const verification = await fetchPayrexxTransaction(transactionId!);
    if (!verification.ok || !verification.transaction) {
      return successResponse({ ok: false, reason: verification.reason || 'lookup_failed' });
    }
    const tx = verification.transaction;

    // Security: the caller may only activate their own subscription.
    // The referenceId encodes the user id — reject cross-user attempts.
    if (typeof tx.referenceId === 'string' && tx.referenceId.length > 0) {
      const refUserId = tx.referenceId.includes('|') ? tx.referenceId.split('|')[0] : tx.referenceId.split('-').slice(0, 5).join('-');
      if (refUserId !== callerId) {
        console.warn(`[verify-payrexx-payment] cross-user attempt caller=${callerId} refUser=${refUserId}`);
        return errorResponse('Forbidden', 403);
      }
    }

    if (tx.status !== 'confirmed') {
      return successResponse({ ok: true, activated: false, status: tx.status });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const result = await activateFromConfirmedTransaction(supabase, tx, { source: 'verify' });
    return successResponse({
      ok: result.ok,
      activated: result.activated,
      alreadyProcessed: result.alreadyProcessed,
      reason: result.reason,
      errorCode: result.errorCode,
    });
  } catch (error) {
    console.error('[verify-payrexx-payment] error', error);
    return errorResponse(error instanceof Error ? error.message : String(error), 500);
  }
});
