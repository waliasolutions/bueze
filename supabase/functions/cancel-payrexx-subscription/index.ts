import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorUtils.ts';
import { generateSignature, normalizePayrexxInstance } from '../_shared/payrexxCrypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY')!;
const PAYREXX_INSTANCE = normalizePayrexxInstance(Deno.env.get('PAYREXX_INSTANCE')!);

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = userData.user.id;

    // Look up the user's subscription
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('handwerker_subscriptions')
      .select('payrexx_subscription_id, auto_renew, plan_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return errorResponse('Subscription nicht gefunden', 404);
    }

    if (!subscription?.payrexx_subscription_id) {
      return errorResponse('Keine automatische Verlängerung aktiv', 400);
    }

    // Cancel subscription on Payrexx
    const subscriptionId = subscription.payrexx_subscription_id;
    const signature = await generateSignature('', PAYREXX_API_KEY);
    const deleteUrl = `https://api.payrexx.com/v1.0/Subscription/${subscriptionId}/?instance=${encodeURIComponent(PAYREXX_INSTANCE)}&ApiSignature=${encodeURIComponent(signature)}`;

    console.log(`Cancelling Payrexx subscription ${subscriptionId} for user ${userId}`);

    const payrexxResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    });

    const responseText = await payrexxResponse.text();
    console.log(`Payrexx DELETE response: status=${payrexxResponse.status} body=${responseText.substring(0, 300)}`);

    // Even if Payrexx returns an error (e.g. subscription already cancelled),
    // still disable auto-renew locally to keep state consistent
    if (payrexxResponse.status !== 200) {
      console.warn(`Payrexx subscription cancellation returned ${payrexxResponse.status}, proceeding with local update`);
    }

    // Update local database
    const { error: updateError } = await supabaseAdmin
      .from('handwerker_subscriptions')
      .update({
        auto_renew: false,
        payrexx_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return errorResponse('Fehler beim Aktualisieren des Abonnements', 500);
    }

    // Create notification
    await supabaseAdmin
      .from('handwerker_notifications')
      .insert({
        user_id: userId,
        type: 'auto_renew_disabled',
        title: 'Automatische Verlängerung deaktiviert',
        message: 'Die automatische Verlängerung Ihres Abonnements wurde deaktiviert. Ihr Abonnement bleibt bis zum Ende der aktuellen Laufzeit aktiv.',
        metadata: { plan_type: subscription.plan_type },
      });

    console.log(`Auto-renewal disabled for user ${userId}`);

    return successResponse({ cancelled: true });
  } catch (error) {
    const msg = getErrorMessage(error);
    console.error(`Fatal error in cancel-payrexx-subscription: ${msg}`);
    return errorResponse(msg, 500);
  }
});
