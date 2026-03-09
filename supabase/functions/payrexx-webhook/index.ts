import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { VALID_PLAN_AMOUNTS, FREE_TIER_PROPOSALS_LIMIT } from '../_shared/planLabels.ts';
import { addMonths } from '../_shared/dateFormatter.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY')!;

// Plan configurations
const PLAN_CONFIGS: Record<string, { proposalsLimit: number; periodMonths: number }> = {
  monthly: { proposalsLimit: -1, periodMonths: 1 },
  '6_month': { proposalsLimit: -1, periodMonths: 6 },
  annual: { proposalsLimit: -1, periodMonths: 12 },
};

/**
 * Verify Payrexx webhook signature
 */
async function verifySignature(body: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(PAYREXX_API_KEY);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(expectedSignature));
    const expectedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return expectedHex === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Parse reference ID to extract user info
 * Format: {userId}|{planType}|{timestamp}
 * Uses pipe delimiter to avoid conflicts with UUID hyphens.
 */
function parseReferenceId(referenceId: string): { userId: string; planType: string; timestamp: string } | null {
  // Support both | (new) and - (legacy) delimiters
  if (referenceId.includes('|')) {
    const parts = referenceId.split('|');
    if (parts.length !== 3) return null;
    return { userId: parts[0], planType: parts[1], timestamp: parts[2] };
  }

  // Legacy fallback: hyphen delimiter (pop from right)
  const parts = referenceId.split('-');
  if (parts.length < 3) return null;
  const timestamp = parts.pop()!;
  const planType = parts.pop()!;
  const userId = parts.join('-');
  return { userId, planType, timestamp };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature (mandatory — reject unsigned webhooks)
    const signature = req.headers.get('x-payrexx-signature') || req.headers.get('payrexx-signature');
    if (!signature) {
      console.error('Missing webhook signature — rejecting unsigned webhook');
      return errorResponse('Missing signature', 403);
    }
    const isValid = await verifySignature(rawBody, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return errorResponse('Invalid signature', 403);
    }

    // Parse form data from Payrexx webhook
    const formData = new URLSearchParams(rawBody);
    const transactionData = formData.get('transaction');

    if (!transactionData) {
      console.error('No transaction data in webhook');
      return successResponse({ received: true, error: 'no_transaction_data' });
    }

    const transaction = JSON.parse(transactionData);

    console.log('Payrexx webhook received:', {
      id: transaction.id,
      status: transaction.status,
      referenceId: transaction.referenceId,
      amount: transaction.amount,
      currency: transaction.currency,
    });

    // Extract transaction details
    const {
      id: transactionId,
      status,
      referenceId,
      amount,
      currency,
      invoice,
    } = transaction;

    // Extract subscription info if present (Payrexx-managed subscriptions)
    const subscriptionId = transaction.subscription?.id || null;
    if (subscriptionId) {
      console.log(`Payrexx webhook: subscription ID ${subscriptionId} present`);
    }

    // Create Supabase admin client (needed for admin_notifications logging)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse and validate reference ID
    const parsedRef = parseReferenceId(referenceId || '');
    if (!parsedRef) {
      console.error('Invalid reference ID format:', referenceId);
      await supabase.from('admin_notifications').insert({
        type: 'webhook_error',
        title: 'Webhook: Ungültige Referenz-ID',
        message: `Payrexx Webhook mit ungültiger Referenz-ID empfangen. Transaction: ${transactionId}`,
        metadata: {
          payrexx_transaction_id: String(transactionId),
          reference_id: String(referenceId || ''),
          error_message: 'Invalid reference ID format',
          timestamp: new Date().toISOString(),
        },
      });
      return successResponse({ received: true, error: 'invalid_reference_id' });
    }

    const { userId, planType } = parsedRef;

    // Validate plan type is known
    if (!PLAN_CONFIGS[planType]) {
      console.error('Unknown plan type in reference ID:', planType);
      await supabase.from('admin_notifications').insert({
        type: 'webhook_error',
        title: 'Webhook: Unbekannter Plan-Typ',
        message: `Payrexx Webhook mit unbekanntem Plan-Typ "${planType}". Transaction: ${transactionId}, User: ${userId}`,
        metadata: {
          payrexx_transaction_id: String(transactionId),
          reference_id: String(referenceId),
          error_message: `Unknown plan type: ${planType}`,
          timestamp: new Date().toISOString(),
        },
      });
      return successResponse({ received: true, error: 'unknown_plan_type' });
    }

    // Handle different transaction statuses
    if (status === 'confirmed') {
      // Validate amount against allowlist
      const validAmounts = VALID_PLAN_AMOUNTS[planType] || [];
      if (validAmounts.length > 0 && amount !== undefined) {
        if (!validAmounts.includes(Number(amount))) {
          console.error(`Amount ${amount} not in valid set ${JSON.stringify(validAmounts)} for plan ${planType}`);
          await supabase.from('admin_notifications').insert({
            type: 'webhook_error',
            title: 'Webhook: Ungültiger Betrag',
            message: `Payrexx Betrag ${amount} stimmt nicht mit Plan "${planType}" überein. Transaction: ${transactionId}, User: ${userId}`,
            metadata: {
              payrexx_transaction_id: String(transactionId),
              reference_id: String(referenceId),
              error_message: `Amount ${amount} not in valid set ${JSON.stringify(validAmounts)}`,
              timestamp: new Date().toISOString(),
            },
          });
          return successResponse({ received: true, error: 'invalid_amount' });
        }
      }

      // Validate currency
      if (currency && currency.toUpperCase() !== 'CHF') {
        console.error(`Currency mismatch: expected CHF, got ${currency}`);
        await supabase.from('admin_notifications').insert({
          type: 'webhook_error',
          title: 'Webhook: Ungültige Währung',
          message: `Payrexx Webhook mit Währung "${currency}" statt CHF. Transaction: ${transactionId}, User: ${userId}`,
          metadata: {
            payrexx_transaction_id: String(transactionId),
            reference_id: String(referenceId),
            error_message: `Currency mismatch: expected CHF, got ${currency}`,
            timestamp: new Date().toISOString(),
          },
        });
        return successResponse({ received: true, error: 'invalid_currency' });
      }

      const now = new Date();
      const planConfig = PLAN_CONFIGS[planType];
      const periodEnd = addMonths(now, planConfig.periodMonths);

      // IDEMPOTENCY: Insert payment record FIRST — if conflict fires, bail
      const { data: insertedPayment } = await supabase
        .from('payment_history')
        .upsert({
          user_id: userId,
          amount: amount,
          currency: (currency || 'CHF').toUpperCase(),
          plan_type: planType,
          status: 'paid',
          payment_provider: 'payrexx',
          payrexx_transaction_id: transactionId.toString(),
          payment_date: now.toISOString(),
          description: subscriptionId
            ? `Büeze ${planType} Abonnement (automatische Verlängerung)`
            : `Büeze ${planType} Abonnement`,
          invoice_pdf_url: invoice?.paymentLink || null,
        }, { onConflict: 'payrexx_transaction_id', ignoreDuplicates: true })
        .select('id');

      if (!insertedPayment || insertedPayment.length === 0) {
        console.log(`Transaction ${transactionId} already processed (conflict), skipping`);
        return successResponse({ received: true, already_processed: true });
      }

      // Check if this is a recurring renewal (subscription already active for this user)
      const { data: existingSub } = await supabase
        .from('handwerker_subscriptions')
        .select('status, plan_type, auto_renew, payrexx_subscription_id')
        .eq('user_id', userId)
        .maybeSingle();

      const isRenewal = existingSub?.auto_renew === true
        && existingSub?.payrexx_subscription_id
        && subscriptionId;

      // Payment confirmed — activate or renew subscription
      const subscriptionData: Record<string, any> = {
        user_id: userId,
        plan_type: planType,
        status: 'active',
        proposals_limit: planConfig.proposalsLimit,
        proposals_used_this_period: isRenewal ? 0 : 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        pending_plan: null,
        renewal_reminder_sent: false,
        payment_reminder_1_sent: false,
        payment_reminder_2_sent: false,
        updated_at: now.toISOString(),
      };

      // Store Payrexx subscription info when present
      if (subscriptionId) {
        subscriptionData.payrexx_subscription_id = subscriptionId.toString();
        subscriptionData.auto_renew = true;
      }

      const { error: subError } = await supabase
        .from('handwerker_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error updating subscription:', subError);
        await supabase.from('admin_notifications').insert({
          type: 'webhook_error',
          title: 'Webhook: Abo-Aktualisierung fehlgeschlagen',
          message: `Subscription-Update für User ${userId} fehlgeschlagen. Transaction: ${transactionId}, Plan: ${planType}. Zahlung wurde erfasst, aber Abo nicht aktiviert.`,
          metadata: {
            payrexx_transaction_id: String(transactionId),
            reference_id: String(referenceId),
            user_id: userId,
            plan_type: planType,
            error_message: String(subError?.message || JSON.stringify(subError)).slice(0, 500),
            timestamp: new Date().toISOString(),
          },
        });
        return successResponse({ received: true, error: 'subscription_update_failed' });
      }

      // Create in-app notification for user
      const notificationType = isRenewal ? 'subscription_renewed' : 'subscription_activated';
      const notificationTitle = isRenewal ? 'Abonnement verlängert' : 'Abonnement aktiviert';
      const notificationMessage = isRenewal
        ? `Ihr ${planType === 'monthly' ? 'monatliches' : planType === '6_month' ? '6-Monats' : 'Jahres'}-Abonnement wurde automatisch verlängert.`
        : `Ihr ${planType === 'monthly' ? 'monatliches' : planType === '6_month' ? '6-Monats' : 'Jahres'}-Abonnement wurde erfolgreich aktiviert.`;

      await supabase
        .from('handwerker_notifications')
        .insert({
          user_id: userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          metadata: { planType, transactionId, subscriptionId, isRenewal },
        });

      // Send subscription confirmation email
      try {
        await supabase.functions.invoke('send-subscription-confirmation', {
          body: { userId, planType },
        });
      } catch (emailError) {
        console.error('Failed to send subscription confirmation email:', emailError);
      }

      // Generate invoice PDF (non-blocking — payment succeeds even if this fails)
      // The DB trigger on the invoices table will automatically send the invoice email
      // once the PDF is uploaded and pdf_storage_path is set.
      try {
        await supabase.functions.invoke('generate-invoice-pdf', {
          body: { paymentId: insertedPayment[0].id, userId, planType, amount },
        });
      } catch (invoiceError) {
        console.error('Failed to generate invoice:', invoiceError);
      }

      console.log(`Subscription ${isRenewal ? 'renewed' : 'activated'} for user ${userId}, plan ${planType}${subscriptionId ? ` (subscription ${subscriptionId})` : ''}`);

    } else if (status === 'waiting') {
      // Payment still processing — acknowledge but don't activate
      console.log(`Payment ${transactionId} for user ${userId} is waiting/processing, no action taken`);

    } else if (status === 'declined' || status === 'failed' || status === 'cancelled') {
      // Payment failed — check if this was an auto-renewal failure
      const { data: existingSub } = await supabase
        .from('handwerker_subscriptions')
        .select('plan_type, auto_renew, payrexx_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      const alreadyPaid = existingSub && existingSub.plan_type !== 'free';
      const isAutoRenewFailure = existingSub?.auto_renew === true && subscriptionId;

      if (isAutoRenewFailure) {
        // Auto-renewal payment failed — disable auto-renew so manual flow takes over
        console.log(`Auto-renewal failed for user ${userId}, disabling auto-renew`);
        await supabase
          .from('handwerker_subscriptions')
          .update({
            auto_renew: false,
            payrexx_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else if (!alreadyPaid) {
        const { error: subError } = await supabase
          .from('handwerker_subscriptions')
          .upsert({
            user_id: userId,
            plan_type: 'free',
            status: 'active',
            proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (subError) {
          console.error('Error reverting subscription:', subError);
        }
      } else {
        console.log(`User ${userId} already has paid plan ${existingSub.plan_type}, not reverting on failed payment`);
      }

      // Record failed payment
      await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          amount: amount,
          currency: (currency || 'CHF').toUpperCase(),
          plan_type: planType,
          status: 'failed',
          payment_provider: 'payrexx',
          payrexx_transaction_id: transactionId.toString(),
          payment_date: new Date().toISOString(),
          description: isAutoRenewFailure
            ? `Automatische Verlängerung fehlgeschlagen: ${planType} Abonnement`
            : `Fehlgeschlagene Zahlung: ${planType} Abonnement`,
        });

      // Notify user
      const failedMessage = isAutoRenewFailure
        ? 'Die automatische Verlängerung Ihres Abonnements ist fehlgeschlagen. Bitte erneuern Sie Ihr Abonnement manuell.'
        : 'Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.';

      await supabase
        .from('handwerker_notifications')
        .insert({
          user_id: userId,
          type: 'payment_failed',
          title: 'Zahlung fehlgeschlagen',
          message: failedMessage,
          metadata: { planType, transactionId, status, subscriptionId, isAutoRenewFailure },
        });

      // Admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'payment_failed',
          title: 'Zahlung fehlgeschlagen',
          message: `Payrexx Zahlung für Benutzer ${userId} fehlgeschlagen. Status: ${status}${isAutoRenewFailure ? ' (Auto-Renewal)' : ''}`,
          metadata: { userId, planType, transactionId, status, subscriptionId },
        });

      console.log(`Payment failed for user ${userId}${isAutoRenewFailure ? ' (auto-renewal disabled)' : ', reverted to free tier'}`);

    } else {
      // Unknown status — log and acknowledge
      console.warn(`Unknown payment status: ${status} for transaction ${transactionId}, user ${userId}`);
    }

    return successResponse({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Payrexx retries, but log the error for admin visibility
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('admin_notifications').insert({
        type: 'webhook_error',
        title: 'Webhook: Unerwarteter Fehler',
        message: `Payrexx Webhook-Verarbeitung fehlgeschlagen: ${String(error instanceof Error ? error.message : error).slice(0, 200)}`,
        metadata: {
          error_message: String(error instanceof Error ? error.message : error).slice(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (notifyError) {
      console.error('Failed to create admin notification for webhook error:', notifyError);
    }
    return successResponse({ received: true, error: 'internal_error' });
  }
});
