import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';

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
 * Format: {userId}-{planType}-{timestamp}
 */
function parseReferenceId(referenceId: string): { userId: string; planType: string; timestamp: string } | null {
  const parts = referenceId.split('-');
  if (parts.length < 3) return null;
  
  // UUID has 5 parts with hyphens, so we need to reconstruct it
  // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-planType-timestamp
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
    
    // Parse form data from Payrexx webhook
    const formData = new URLSearchParams(rawBody);
    const transactionData = formData.get('transaction');
    
    if (!transactionData) {
      console.error('No transaction data in webhook');
      return errorResponse('No transaction data', 400);
    }

    const transaction = JSON.parse(transactionData);
    
    console.log('Payrexx webhook received:', {
      id: transaction.id,
      status: transaction.status,
      referenceId: transaction.referenceId,
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

    // Parse reference ID
    const parsedRef = parseReferenceId(referenceId || '');
    if (!parsedRef) {
      console.error('Invalid reference ID format:', referenceId);
      return errorResponse('Invalid reference ID', 400);
    }

    const { userId, planType } = parsedRef;

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different transaction statuses
    if (status === 'confirmed' || status === 'waiting') {
      // Payment successful - activate subscription
      const planConfig = PLAN_CONFIGS[planType];
      if (!planConfig) {
        console.error('Unknown plan type:', planType);
        return errorResponse('Unknown plan type', 400);
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + planConfig.periodMonths);

      // Update or create subscription
      const { error: subError } = await supabase
        .from('handwerker_subscriptions')
        .upsert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          proposals_limit: planConfig.proposalsLimit,
          proposals_used_this_period: 0,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error updating subscription:', subError);
        return errorResponse('Failed to update subscription', 500);
      }

      // Record payment in history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          amount: amount / 100, // Convert from Rappen to CHF
          currency: currency || 'CHF',
          plan_type: planType,
          status: 'succeeded',
          payment_provider: 'payrexx',
          payrexx_transaction_id: transactionId.toString(),
          payment_date: now.toISOString(),
          description: `Büeze ${planType} Abonnement`,
          invoice_pdf_url: invoice?.paymentLink || null,
        });

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        // Don't fail the webhook for this
      }

      // Create notification for user
      await supabase
        .from('handwerker_notifications')
        .insert({
          user_id: userId,
          type: 'subscription_activated',
          title: 'Abonnement aktiviert',
          message: `Ihr ${planType === 'monthly' ? 'monatliches' : planType === '6_month' ? '6-Monats' : 'Jahres'}-Abonnement wurde erfolgreich aktiviert.`,
          metadata: { planType, transactionId },
        });

      console.log(`Subscription activated for user ${userId}, plan ${planType}`);

    } else if (status === 'declined' || status === 'failed' || status === 'cancelled') {
      // Payment failed - revert to free tier
      const { error: subError } = await supabase
        .from('handwerker_subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'free',
          status: 'active',
          proposals_limit: 5,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error reverting subscription:', subError);
      }

      // Record failed payment
      await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          amount: amount / 100,
          currency: currency || 'CHF',
          plan_type: planType,
          status: 'failed',
          payment_provider: 'payrexx',
          payrexx_transaction_id: transactionId.toString(),
          payment_date: new Date().toISOString(),
          description: `Fehlgeschlagene Zahlung: ${planType} Abonnement`,
        });

      // Notify user
      await supabase
        .from('handwerker_notifications')
        .insert({
          user_id: userId,
          type: 'payment_failed',
          title: 'Zahlung fehlgeschlagen',
          message: 'Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
          metadata: { planType, transactionId, status },
        });

      // Admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'payment_failed',
          title: 'Zahlung fehlgeschlagen',
          message: `Payrexx Zahlung für Benutzer ${userId} fehlgeschlagen. Status: ${status}`,
          metadata: { userId, planType, transactionId, status },
        });

      console.log(`Payment failed for user ${userId}, reverted to free tier`);
    }

    return successResponse({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
