import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightRequest, successResponse } from '../_shared/cors.ts';
import { FREE_TIER_PROPOSALS_LIMIT } from '../_shared/planLabels.ts';
import {
  activateFromConfirmedTransaction,
  fetchPayrexxTransaction,
  parseReferenceId,
} from '../_shared/payrexxActivation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Parse Payrexx "Normal (PHP-Post)" form body into a nested object.
    const rawBody = await req.text();
    const formParams = new URLSearchParams(rawBody);
    const root: Record<string, any> = {};
    for (const [key, value] of formParams.entries()) {
      const match = key.match(/^([^\[\]]+)((\[[^\[\]]*\])*)$/);
      if (!match) continue;
      const head = match[1];
      const tailKeys = [...match[2].matchAll(/\[([^\[\]]*)\]/g)].map((m) => m[1]);
      const path = [head, ...tailKeys];
      let cursor: any = root;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        const nextIsIndex = /^\d+$/.test(path[i + 1]);
        if (cursor[k] === undefined) cursor[k] = nextIsIndex ? [] : {};
        cursor = cursor[k];
      }
      const lastKey = path[path.length - 1];
      if (cursor[lastKey] === undefined || cursor[lastKey] === '') cursor[lastKey] = value;
    }

    const transaction = root.transaction;
    if (!transaction || typeof transaction !== 'object') {
      console.error('[payrexx-webhook] no transaction in body');
      return successResponse({ received: true, error: 'no_transaction_data' });
    }

    const transactionId = transaction.id;
    const status = transaction.status;
    const referenceId = transaction.referenceId;
    const amount = transaction.amount !== undefined ? Number(transaction.amount) : undefined;
    const currency = transaction.invoice?.currency;
    const subscriptionId = transaction.subscription?.id || null;

    console.log('[payrexx-webhook] received', { transactionId, status, referenceId, amount });

    if (!transactionId) {
      return successResponse({ received: true, error: 'missing_transaction_id' });
    }

    // Verify against Payrexx API (form bodies aren't signed).
    const verification = await fetchPayrexxTransaction(transactionId, { status, amount, referenceId });
    if (!verification.ok || !verification.transaction) {
      console.error(`[payrexx-webhook] verification failed tx=${transactionId}: ${verification.reason}`);
      await supabase.from('admin_notifications').insert({
        type: 'webhook_error',
        title: 'Webhook: Verifizierung fehlgeschlagen',
        message: `Payrexx Webhook konnte nicht verifiziert werden. Transaction: ${transactionId}. Grund: ${verification.reason}`,
        metadata: {
          payrexx_transaction_id: String(transactionId),
          reference_id: String(referenceId || ''),
          error_message: String(verification.reason || '').slice(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
      return successResponse({ received: true, error: 'verification_failed' });
    }
    const tx = verification.transaction;

    if (tx.status === 'confirmed') {
      const result = await activateFromConfirmedTransaction(supabase, tx, { source: 'webhook' });
      if (!result.ok) {
        console.error(`[payrexx-webhook] activation failed: ${result.errorCode} ${result.reason}`);
        await supabase.from('admin_notifications').insert({
          type: 'webhook_error',
          title: 'Webhook: Aktivierung fehlgeschlagen',
          message: `Aktivierung fehlgeschlagen (${result.errorCode}). Transaction: ${transactionId}`,
          metadata: {
            payrexx_transaction_id: String(transactionId),
            reference_id: String(referenceId || ''),
            error_code: result.errorCode,
            error_message: result.reason,
            timestamp: new Date().toISOString(),
          },
        });
        return successResponse({ received: true, error: result.errorCode });
      }
      return successResponse({ received: true, activated: result.activated, alreadyProcessed: result.alreadyProcessed });
    }

    if (tx.status === 'waiting') {
      console.log(`[payrexx-webhook] tx ${transactionId} waiting`);
      return successResponse({ received: true, waiting: true });
    }

    if (tx.status === 'declined' || tx.status === 'failed' || tx.status === 'cancelled') {
      const parsed = parseReferenceId(referenceId || '');
      if (!parsed) return successResponse({ received: true, error: 'invalid_reference_id' });
      const { userId, planType } = parsed;

      const { data: existingSub } = await supabase
        .from('handwerker_subscriptions')
        .select('plan_type, auto_renew, payrexx_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      const alreadyPaid = existingSub && existingSub.plan_type !== 'free';
      const isAutoRenewFailure = existingSub?.auto_renew === true && subscriptionId;

      if (isAutoRenewFailure) {
        await supabase
          .from('handwerker_subscriptions')
          .update({ auto_renew: false, payrexx_subscription_id: null, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else if (!alreadyPaid) {
        await supabase.from('handwerker_subscriptions').upsert(
          {
            user_id: userId,
            plan_type: 'free',
            status: 'active',
            proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }

      await supabase.from('payment_history').upsert(
        {
          user_id: userId,
          amount,
          currency: (currency || 'CHF').toUpperCase(),
          plan_type: planType,
          status: 'failed',
          payment_provider: 'payrexx',
          payrexx_transaction_id: String(transactionId),
          payment_date: new Date().toISOString(),
          description: isAutoRenewFailure
            ? `Automatische Verlängerung fehlgeschlagen: ${planType} Abonnement`
            : `Fehlgeschlagene Zahlung: ${planType} Abonnement`,
        },
        { onConflict: 'payrexx_transaction_id', ignoreDuplicates: true }
      );

      await supabase.from('handwerker_notifications').insert({
        user_id: userId,
        type: 'payment_failed',
        title: 'Zahlung fehlgeschlagen',
        message: isAutoRenewFailure
          ? 'Die automatische Verlängerung Ihres Abonnements ist fehlgeschlagen. Bitte erneuern Sie Ihr Abonnement manuell.'
          : 'Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
        metadata: { planType, transactionId, status: tx.status, subscriptionId, isAutoRenewFailure },
      });

      await supabase.from('admin_notifications').insert({
        type: 'payment_failed',
        title: 'Zahlung fehlgeschlagen',
        message: `Payrexx Zahlung für Benutzer ${userId} fehlgeschlagen. Status: ${tx.status}${isAutoRenewFailure ? ' (Auto-Renewal)' : ''}`,
        metadata: { userId, planType, transactionId, status: tx.status, subscriptionId },
      });

      return successResponse({ received: true, failed: true });
    }

    console.warn(`[payrexx-webhook] unknown status ${tx.status} tx=${transactionId}`);
    return successResponse({ received: true });
  } catch (error) {
    console.error('[payrexx-webhook] unexpected error', error);
    try {
      await supabase.from('admin_notifications').insert({
        type: 'webhook_error',
        title: 'Webhook: Unerwarteter Fehler',
        message: `Payrexx Webhook-Verarbeitung fehlgeschlagen: ${String(error instanceof Error ? error.message : error).slice(0, 200)}`,
        metadata: {
          error_message: String(error instanceof Error ? error.message : error).slice(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (_e) { /* ignore */ }
    return successResponse({ received: true, error: 'internal_error' });
  }
});
