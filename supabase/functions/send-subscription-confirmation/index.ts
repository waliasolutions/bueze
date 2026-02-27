import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { subscriptionConfirmationTemplate } from '../_shared/emailTemplates.ts';
import { getPlanName, PLAN_AMOUNTS } from '../_shared/planLabels.ts';
import { formatSwissDate } from '../_shared/dateFormatter.ts';

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, planType, periodEnd, amount } = await req.json();

    if (!userId || !planType) {
      throw new Error("userId and planType are required");
    }

    console.log(`[send-subscription-confirmation] Processing for user: ${userId}, plan: ${planType}`);

    const supabase = createSupabaseAdmin();

    // Get handwerker profile
    const { data: hwProfile } = await supabase
      .from('handwerker_profiles')
      .select('first_name, last_name, company_name')
      .eq('user_id', userId)
      .single();

    // Get email from profiles table
    const { data: emailProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!emailProfile?.email) {
      console.log('[send-subscription-confirmation] No email found, skipping notification');
      return successResponse({ success: true, message: 'No email to send' });
    }

    const handwerkerName = hwProfile?.company_name ||
      `${hwProfile?.first_name || ''} ${hwProfile?.last_name || ''}`.trim() ||
      emailProfile.full_name || 'Handwerker';

    // Auto-lookup periodEnd from subscription if not provided
    let resolvedPeriodEnd = periodEnd;
    let resolvedAmount = amount;

    if (!resolvedPeriodEnd || !resolvedAmount) {
      const { data: subscription } = await supabase
        .from('handwerker_subscriptions')
        .select('current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!resolvedPeriodEnd && subscription?.current_period_end) {
        resolvedPeriodEnd = subscription.current_period_end;
      }
      if (!resolvedAmount && PLAN_AMOUNTS[planType]) {
        resolvedAmount = PLAN_AMOUNTS[planType];
      }
    }

    const planName = getPlanName(planType);
    const formattedPeriodEnd = resolvedPeriodEnd
      ? formatSwissDate(resolvedPeriodEnd)
      : 'Unbegrenzt';
    const formattedAmount = resolvedAmount ? `CHF ${(resolvedAmount / 100).toFixed(2)}` : 'Gemäss Ihrem Plan';

    console.log(`[send-subscription-confirmation] Sending confirmation to ${emailProfile.email}`);

    const emailHtml = subscriptionConfirmationTemplate({
      handwerkerName,
      planName,
      periodEnd: formattedPeriodEnd,
      amount: formattedAmount,
    });

    const result = await sendEmail({
      to: emailProfile.email,
      subject: `🎉 Ihr ${planName}-Abonnement ist aktiv - Büeze.ch`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log("[send-subscription-confirmation] Confirmation email sent successfully");

    return successResponse({ success: true, message: 'Subscription confirmation sent' });
  } catch (error: any) {
    console.error("[send-subscription-confirmation] Error:", error);
    return errorResponse(error.message, 500);
  }
});
