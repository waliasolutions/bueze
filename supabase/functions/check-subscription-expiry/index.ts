// Edge function: check-subscription-expiry
// Runs daily via cron to:
// 1. Expire subscriptions past their current_period_end
// 2. Send warning emails 7 days before expiry

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper, safe } from '../_shared/emailTemplates.ts';
import { getPlanName, FREE_TIER_PROPOSALS_LIMIT } from '../_shared/planLabels.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    console.log('[check-subscription-expiry] Starting subscription expiry check...');

    // 1. Downgrade expired paid subscriptions to free (keep status 'active' to avoid unique constraint issues)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expired, error: expireError } = await supabase
      .from('handwerker_subscriptions')
      .update({
        plan_type: 'free',
        proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
        proposals_used_this_period: 0,
        current_period_start: now,
        current_period_end: thirtyDaysFromNow.toISOString(),
        updated_at: now,
      })
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .lt('current_period_end', now)
      .select('user_id, plan_type');

    if (expireError) {
      console.error('Error expiring subscriptions:', expireError);
    }

    const expiredCount = expired?.length || 0;
    console.log(`[check-subscription-expiry] Expired ${expiredCount} subscriptions`);

    // Notify expired users
    for (const sub of expired || []) {
      try {
        const { data: profile } = await supabase
          .from('handwerker_profiles')
          .select('first_name, last_name')
          .eq('user_id', sub.user_id)
          .single();

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', sub.user_id)
          .single();

        if (userProfile?.email) {
          const name = safe(profile?.first_name, 'Handwerker');
          const planName = getPlanName(sub.plan_type);

          await sendEmail({
            to: userProfile.email,
            subject: `Ihr ${planName} Abonnement ist abgelaufen`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement abgelaufen
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement ist abgelaufen. Sie wurden auf den kostenlosen Plan umgestellt.
                Um weiterhin unbegrenzt Offerten einzureichen, erneuern Sie Ihr Abonnement.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/checkout" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Abonnement erneuern
                </a>
              </div>
            `),
          });
        }

        // Create in-app notification
        await supabase.from('handwerker_notifications').insert({
          user_id: sub.user_id,
          type: 'subscription_expired',
          title: 'Abonnement abgelaufen',
          message: `Ihr ${getPlanName(sub.plan_type)} Abonnement ist abgelaufen. Erneuern Sie es, um weiterhin Offerten einzureichen.`,
          metadata: { plan_type: sub.plan_type },
        });
      } catch (err) {
        console.error(`Error notifying expired user ${sub.user_id}:`, err);
      }
    }

    // 2. Send warning emails 7 days before expiry (only if not already warned)
    const sevenDaysStart = new Date(sevenDaysFromNow);
    sevenDaysStart.setHours(0, 0, 0, 0);
    const sevenDaysEnd = new Date(sevenDaysFromNow);
    sevenDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiring, error: warningError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type, current_period_end')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .gte('current_period_end', sevenDaysStart.toISOString())
      .lt('current_period_end', sevenDaysEnd.toISOString());

    if (warningError) {
      console.error('Error fetching expiring subscriptions:', warningError);
    }

    let warningsSent = 0;
    for (const sub of expiring || []) {
      try {
        const { data: profile } = await supabase
          .from('handwerker_profiles')
          .select('first_name')
          .eq('user_id', sub.user_id)
          .single();

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', sub.user_id)
          .single();

        if (userProfile?.email) {
          const name = safe(profile?.first_name, 'Handwerker');
          const planName = getPlanName(sub.plan_type);
          const expiryDate = new Date(sub.current_period_end).toLocaleDateString('de-CH');

          await sendEmail({
            to: userProfile.email,
            subject: `Ihr ${planName} Abonnement läuft in 7 Tagen ab`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement läuft bald ab
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement läuft am <strong>${expiryDate}</strong> ab.
                Erneuern Sie es rechtzeitig, um weiterhin unbegrenzt Offerten einzureichen.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/checkout" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Jetzt erneuern
                </a>
              </div>
            `),
          });
          warningsSent++;
        }
      } catch (err) {
        console.error(`Error warning expiring user ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Sent ${warningsSent} expiry warnings`);

    return successResponse({
      expired: expiredCount,
      warnings_sent: warningsSent,
    });
  } catch (error) {
    console.error('[check-subscription-expiry] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
