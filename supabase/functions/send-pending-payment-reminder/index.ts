// Edge function: send-pending-payment-reminder
// Sends payment reminders to approved handwerkers with pending paid plans
// Runs daily via cron job

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { pendingPaymentFirstReminderTemplate, pendingPaymentFinalReminderTemplate } from '../_shared/emailTemplates.ts';
import { getPlanNameWithPrice } from '../_shared/planLabels.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

function getCheckoutUrl(plan: string): string {
  return `${FRONTEND_URL}/checkout?plan=${plan}`;
}

function getCancelPendingPlanUrl(): string {
  return `${FRONTEND_URL}/profile?tab=subscription&cancel_pending=true`;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

    console.log('Starting pending payment reminder check...');

    // Query handwerker_subscriptions with pending_plan, still on free tier
    const { data: subscriptions, error: subError } = await supabase
      .from('handwerker_subscriptions')
      .select(`
        id,
        user_id,
        pending_plan,
        payment_reminder_1_sent,
        payment_reminder_2_sent
      `)
      .not('pending_plan', 'is', null)
      .eq('plan_type', 'free');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return errorResponse('Failed to fetch subscriptions', 500);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No pending payment subscriptions found');
      return successResponse({ message: 'No pending payments to process', processed: 0 });
    }

    console.log(`Found ${subscriptions.length} subscriptions with pending plans`);

    let firstRemindersSent = 0;
    let finalRemindersSent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Fetch handwerker profile for this user
        const { data: profile, error: profileError } = await supabase
          .from('handwerker_profiles')
          .select('verified_at, first_name, last_name, company_name, email')
          .eq('user_id', sub.user_id)
          .single();

        if (profileError || !profile) {
          console.log(`No profile found for user ${sub.user_id}, skipping`);
          continue;
        }

        // Skip if not yet approved
        if (!profile.verified_at) {
          console.log(`Profile not yet verified for user ${sub.user_id}, skipping`);
          continue;
        }

        const verifiedAt = new Date(profile.verified_at);
        const now = new Date();
        const hoursSinceApproval = (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60);

        console.log(`User ${sub.user_id}: approved ${hoursSinceApproval.toFixed(1)} hours ago`);

        const name = profile.first_name || profile.company_name || 'Handwerker';
        const email = profile.email;

        if (!email) {
          console.log(`No email for user ${sub.user_id}, skipping`);
          continue;
        }

        const planName = getPlanNameWithPrice(sub.pending_plan);
        const checkoutUrl = getCheckoutUrl(sub.pending_plan);
        const cancelUrl = getCancelPendingPlanUrl();

        // First reminder: 48+ hours after approval, not yet sent
        if (hoursSinceApproval >= 48 && !sub.payment_reminder_1_sent) {
          console.log(`Sending first reminder to ${email}`);

          const emailResult = await sendEmail({
            to: email,
            subject: '💳 Vergessen? Ihr Abo wartet auf Sie - Büeze.ch',
            htmlBody: pendingPaymentFirstReminderTemplate({ name, planName, checkoutUrl }),
          });

          if (emailResult.success) {
            const { error: updateError } = await supabase
              .from('handwerker_subscriptions')
              .update({ payment_reminder_1_sent: true })
              .eq('id', sub.id);

            if (updateError) {
              console.error(`Failed to update reminder flag for ${sub.id}:`, updateError);
              errors.push(`Update failed for ${sub.id}: ${updateError.message}`);
            } else {
              firstRemindersSent++;
              console.log(`First reminder sent successfully to ${email}`);
            }
          } else {
            console.error(`Failed to send email to ${email}:`, emailResult.error);
            errors.push(`Email failed for ${email}: ${emailResult.error}`);
          }
        }

        // Final reminder: 168+ hours (7 days) after approval, first already sent, final not yet sent
        if (hoursSinceApproval >= 168 && sub.payment_reminder_1_sent && !sub.payment_reminder_2_sent) {
          console.log(`Sending final reminder to ${email}`);

          const emailResult = await sendEmail({
            to: email,
            subject: '⏰ Letzte Erinnerung: Aktivieren Sie Ihr Abo - Büeze.ch',
            htmlBody: pendingPaymentFinalReminderTemplate({ name, planName, checkoutUrl, cancelUrl }),
          });

          if (emailResult.success) {
            const { error: updateError } = await supabase
              .from('handwerker_subscriptions')
              .update({ payment_reminder_2_sent: true })
              .eq('id', sub.id);

            if (updateError) {
              console.error(`Failed to update final reminder flag for ${sub.id}:`, updateError);
              errors.push(`Update failed for ${sub.id}: ${updateError.message}`);
            } else {
              finalRemindersSent++;
              console.log(`Final reminder sent successfully to ${email}`);
            }
          } else {
            console.error(`Failed to send final email to ${email}:`, emailResult.error);
            errors.push(`Email failed for ${email}: ${emailResult.error}`);
          }
        }
      } catch (error) {
        console.error(`Error processing subscription ${sub.id}:`, error);
        errors.push(`Processing error for ${sub.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const result = {
      message: 'Payment reminder job completed',
      firstRemindersSent,
      finalRemindersSent,
      totalProcessed: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Job completed:', result);
    return successResponse(result);

  } catch (error) {
    console.error('Unexpected error in payment reminder job:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unexpected error',
      500
    );
  }
});
