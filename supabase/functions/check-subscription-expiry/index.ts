// Edge function: check-subscription-expiry
// Runs daily via cron to:
// 1. Downgrade cancelled subscriptions (pending_plan = 'free') past expiry
// 2. Send renewal emails for non-cancelled subs in grace period (7 days past expiry)
// 3. Downgrade non-cancelled subs after grace period expires
// 4. Send 7-day warning emails before expiry

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper, safe } from '../_shared/emailTemplates.ts';
import { getPlanName, FREE_TIER_PROPOSALS_LIMIT, PLAN_AMOUNTS, PLAN_GATEWAY_NAMES, PLAN_CONFIGS } from '../_shared/planLabels.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';
import { addDays, startOfDaySwiss, endOfDaySwiss, formatSwissDate, addMonths } from '../_shared/dateFormatter.ts';

const GRACE_PERIOD_DAYS = 1; // 24-hour grace period

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    const now = new Date();
    const nowISO = now.toISOString();
    const gracePeriodCutoff = addDays(now, -GRACE_PERIOD_DAYS).toISOString();

    console.log('[check-subscription-expiry] Starting subscription expiry check...');

    let cancelledCount = 0;
    let renewalEmailsSent = 0;
    let graceExpiredCount = 0;
    let warningsSent = 0;
    let downgradeCount = 0;

    const thirtyDaysFromNow = addDays(now, 30);

    // ============================================================
    // PATH A0: Paid plan downgrades (pending_plan is a paid plan, not 'free')
    // Switch to the new paid plan at period end
    // ============================================================
    const { data: downgradeSubs, error: downgradeError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type, pending_plan')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .not('pending_plan', 'is', null)
      .neq('pending_plan', 'free')
      .lt('current_period_end', nowISO);

    if (downgradeError) {
      console.error('Error fetching downgrade subs:', downgradeError);
    }

    const PAID_PLAN_TYPES = ['monthly', '6_month', 'annual'];
    for (const sub of downgradeSubs || []) {
      if (!sub.pending_plan || !PAID_PLAN_TYPES.includes(sub.pending_plan)) continue;
      try {
        const newPlanType = sub.pending_plan;
        await supabase
          .from('handwerker_subscriptions')
          .update({
            plan_type: newPlanType,
            proposals_limit: -1,
            proposals_used_this_period: 0,
            current_period_start: nowISO,
            current_period_end: addMonths(now, PLAN_CONFIGS[newPlanType]?.periodMonths || 1).toISOString(),
            pending_plan: null,
            renewal_reminder_sent: false,
            updated_at: nowISO,
          })
          .eq('user_id', sub.user_id);

        const { profile, email } = await fetchUserInfo(supabase, sub.user_id);
        const name = safe(profile?.first_name, 'Handwerker');
        const oldPlanName = getPlanName(sub.plan_type);
        const newPlanName = getPlanName(newPlanType);

        if (email) {
          await sendEmail({
            to: email,
            subject: `Planwechsel: ${oldPlanName} → ${newPlanName}`,
            htmlBody: emailWrapper(`
              <div class="content">
                <h2>Planwechsel durchgeführt</h2>
                <p>Hallo ${name},</p>
                <p>Wie gewünscht wurde Ihr Plan von <strong>${oldPlanName}</strong> auf <strong>${newPlanName}</strong> umgestellt.
                Bitte schliessen Sie die Zahlung für den neuen Plan ab, um Ihren Zugang zu behalten.</p>
                <p style="text-align: center;">
                  <a href="${FRONTEND_URL}/checkout?plan=${newPlanType}" class="button">Jetzt bezahlen</a>
                </p>
              </div>
            `),
          });
        }

        await supabase.from('handwerker_notifications').insert({
          user_id: sub.user_id,
          type: 'subscription_downgraded',
          title: 'Planwechsel durchgeführt',
          message: `Ihr Plan wurde von ${oldPlanName} auf ${newPlanName} umgestellt.`,
          metadata: { old_plan: sub.plan_type, new_plan: newPlanType },
        });

        downgradeCount++;
      } catch (err) {
        console.error(`Error processing downgrade for ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Processed ${downgradeCount} plan downgrades`);

    // ============================================================
    // PATH A: Cancelled subs (pending_plan = 'free' AND expired)
    // Downgrade immediately
    // ============================================================

    const { data: cancelledSubs, error: cancelError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .eq('pending_plan', 'free')
      .lt('current_period_end', nowISO);

    if (cancelError) {
      console.error('Error fetching cancelled subs:', cancelError);
    }

    for (const sub of cancelledSubs || []) {
      try {
        // Downgrade to free
        await supabase
          .from('handwerker_subscriptions')
          .update({
            plan_type: 'free',
            proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
            proposals_used_this_period: 0,
            current_period_start: nowISO,
            current_period_end: thirtyDaysFromNow.toISOString(),
            pending_plan: null,
            renewal_reminder_sent: false,
            updated_at: nowISO,
          })
          .eq('user_id', sub.user_id);

        const { profile, email } = await fetchUserInfo(supabase, sub.user_id);
        const name = safe(profile?.first_name, 'Handwerker');
        const planName = getPlanName(sub.plan_type);

        if (email) {
          await sendEmail({
            to: email,
            subject: `Ihr ${planName} Abonnement wurde beendet`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement beendet
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Wie gewünscht wurde Ihr <strong>${planName}</strong> Abonnement beendet. Sie wurden auf den kostenlosen Plan umgestellt.
                Sie können jederzeit ein neues Abonnement abschliessen.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/checkout" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Neues Abonnement abschliessen
                </a>
              </div>
            `),
          });
        }

        await supabase.from('handwerker_notifications').insert({
          user_id: sub.user_id,
          type: 'subscription_cancelled',
          title: 'Abonnement beendet',
          message: `Ihr ${planName} Abonnement wurde planmässig beendet. Sie sind jetzt auf dem kostenlosen Plan.`,
          metadata: { plan_type: sub.plan_type },
        });

        cancelledCount++;
      } catch (err) {
        console.error(`Error processing cancelled sub for ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Downgraded ${cancelledCount} cancelled subscriptions`);

    // ============================================================
    // PATH B: Non-cancelled, within grace period (expired but < 24 hours ago)
    // Send renewal email with Payrexx checkout link, don't downgrade yet
    // ============================================================
    // Skip auto-renew users — Payrexx handles their billing automatically
    const { data: gracePeriodSubs, error: graceError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type, current_period_end')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .is('pending_plan', null)
      .eq('renewal_reminder_sent', false)
      .eq('auto_renew', false)
      .lt('current_period_end', nowISO)
      .gt('current_period_end', gracePeriodCutoff);

    if (graceError) {
      console.error('Error fetching grace period subs:', graceError);
    }

    for (const sub of gracePeriodSubs || []) {
      try {
        const { profile, email } = await fetchUserInfo(supabase, sub.user_id);
        const name = safe(profile?.first_name, 'Handwerker');
        const planName = getPlanName(sub.plan_type);
        const graceEndDate = formatSwissDate(addDays(sub.current_period_end, GRACE_PERIOD_DAYS));

        // Generate Payrexx checkout link via create-payrexx-gateway invocation
        // Uses service-role key so we must pass userId + userEmail in the body
        let checkoutUrl = `${FRONTEND_URL}/checkout`;
        try {
          const { data: gatewayData, error: gatewayError } = await supabase.functions.invoke('create-payrexx-gateway', {
            body: {
              planType: sub.plan_type,
              successUrl: `${FRONTEND_URL}/handwerker-dashboard?payment=success`,
              cancelUrl: `${FRONTEND_URL}/handwerker-dashboard?payment=cancelled`,
              userId: sub.user_id,
              userEmail: email,
            },
          });

          if (!gatewayError && gatewayData?.url) {
            checkoutUrl = gatewayData.url;
          } else {
            console.warn(`Could not create Payrexx gateway for ${sub.user_id}, using fallback checkout URL`);
          }
        } catch (gwErr) {
          console.warn(`Gateway creation failed for ${sub.user_id}, using fallback:`, gwErr);
        }

        if (email) {
          await sendEmail({
            to: email,
            subject: `Verlängerung erforderlich: ${planName} Abonnement`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement-Verlängerung erforderlich
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement muss verlängert werden. Gemäss unseren AGB wird Ihr Abonnement automatisch verlängert.
                Bitte schliessen Sie die Zahlung innerhalb von <strong>24 Stunden</strong> ab, um Ihren Zugang zu behalten.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${checkoutUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Jetzt verlängern
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
                Falls die Zahlung nicht innerhalb von 24 Stunden eingeht, wird Ihr Konto auf den kostenlosen Plan umgestellt.
              </p>
            `),
          });
          renewalEmailsSent++;
        }

        // Mark renewal reminder as sent
        await supabase
          .from('handwerker_subscriptions')
          .update({ renewal_reminder_sent: true, updated_at: nowISO })
          .eq('user_id', sub.user_id);

        await supabase.from('handwerker_notifications').insert({
          user_id: sub.user_id,
          type: 'subscription_renewal_required',
          title: 'Abonnement-Verlängerung erforderlich',
          message: `Bitte schliessen Sie die Zahlung für Ihr ${planName} Abonnement innerhalb von 24 Stunden ab.`,
          metadata: { plan_type: sub.plan_type, checkout_url: checkoutUrl },
        });
      } catch (err) {
        console.error(`Error processing grace period sub for ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Sent ${renewalEmailsSent} renewal emails`);

    // ============================================================
    // PATH C: Non-cancelled, grace period expired (> 24 hours past expiry)
    // Downgrade to free
    // ============================================================
    // Skip auto-renew users — Payrexx handles their billing automatically
    const { data: graceExpiredSubs, error: graceExpiredError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .is('pending_plan', null)
      .eq('auto_renew', false)
      .lt('current_period_end', gracePeriodCutoff);

    if (graceExpiredError) {
      console.error('Error fetching grace-expired subs:', graceExpiredError);
    }

    for (const sub of graceExpiredSubs || []) {
      try {
        await supabase
          .from('handwerker_subscriptions')
          .update({
            plan_type: 'free',
            proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
            proposals_used_this_period: 0,
            current_period_start: nowISO,
            current_period_end: thirtyDaysFromNow.toISOString(),
            pending_plan: null,
            renewal_reminder_sent: false,
            updated_at: nowISO,
          })
          .eq('user_id', sub.user_id);

        const { profile, email } = await fetchUserInfo(supabase, sub.user_id);
        const name = safe(profile?.first_name, 'Handwerker');
        const planName = getPlanName(sub.plan_type);

        if (email) {
          await sendEmail({
            to: email,
            subject: `Ihr ${planName} Abonnement ist abgelaufen`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement abgelaufen
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement ist abgelaufen, da die Verlängerungszahlung nicht innerhalb der Frist eingegangen ist.
                Sie wurden auf den kostenlosen Plan umgestellt. Sie können jederzeit ein neues Abonnement abschliessen.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/checkout" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Abonnement erneuern
                </a>
              </div>
            `),
          });
        }

        await supabase.from('handwerker_notifications').insert({
          user_id: sub.user_id,
          type: 'subscription_expired',
          title: 'Abonnement abgelaufen',
          message: `Ihr ${planName} Abonnement ist abgelaufen. Erneuern Sie es, um weiterhin Offerten einzureichen.`,
          metadata: { plan_type: sub.plan_type },
        });

        graceExpiredCount++;
      } catch (err) {
        console.error(`Error processing grace-expired sub for ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Downgraded ${graceExpiredCount} grace-expired subscriptions`);

    // ============================================================
    // 7-DAY WARNING EMAILS (before expiry)
    // Different message depending on cancellation status
    // ============================================================
    const sevenDaysFromNow = addDays(now, 7);
    const sevenDaysStart = startOfDaySwiss(sevenDaysFromNow);
    const sevenDaysEnd = endOfDaySwiss(sevenDaysFromNow);

    const { data: expiring, error: warningError } = await supabase
      .from('handwerker_subscriptions')
      .select('user_id, plan_type, current_period_end, pending_plan')
      .eq('status', 'active')
      .neq('plan_type', 'free')
      .gte('current_period_end', sevenDaysStart.toISOString())
      .lt('current_period_end', sevenDaysEnd.toISOString());

    if (warningError) {
      console.error('Error fetching expiring subscriptions:', warningError);
    }

    for (const sub of expiring || []) {
      try {
        const { profile, email } = await fetchUserInfo(supabase, sub.user_id);
        if (!email) continue;

        const name = safe(profile?.first_name, 'Handwerker');
        const planName = getPlanName(sub.plan_type);
        const expiryDate = formatSwissDate(sub.current_period_end);

        const isCancelled = sub.pending_plan === 'free';

        if (isCancelled) {
          // User has cancelled — inform about downgrade
          await sendEmail({
            to: email,
            subject: `Ihr ${planName} Abonnement endet am ${expiryDate}`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement endet bald
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement endet am <strong>${expiryDate}</strong>.
                Danach werden Sie auf den kostenlosen Plan umgestellt.
                Sie können die Kündigung jederzeit vor Ablauf rückgängig machen.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/handwerker-dashboard" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Kündigung rückgängig machen
                </a>
              </div>
            `),
          });
        } else {
          // Non-cancelled — remind about renewal payment
          await sendEmail({
            to: email,
            subject: `Ihr ${planName} Abonnement wird am ${expiryDate} verlängert`,
            htmlBody: emailWrapper(`
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 16px;">
                Abonnement wird verlängert
              </h1>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 16px;">
                Hallo ${name},
              </p>
              <p style="font-size: 16px; color: #4a4a68; margin-bottom: 24px;">
                Ihr <strong>${planName}</strong> Abonnement wird am <strong>${expiryDate}</strong> verlängert.
                Sie erhalten zu diesem Zeitpunkt einen Zahlungslink, um die Verlängerung abzuschliessen.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Falls Sie das Abonnement nicht verlängern möchten, können Sie es in Ihrem Dashboard kündigen.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${FRONTEND_URL}/handwerker-dashboard" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Zum Dashboard
                </a>
              </div>
            `),
          });
        }
        warningsSent++;
      } catch (err) {
        console.error(`Error warning expiring user ${sub.user_id}:`, err);
      }
    }

    console.log(`[check-subscription-expiry] Sent ${warningsSent} expiry warnings`);

    return successResponse({
      plan_downgrades: downgradeCount,
      cancelled_downgraded: cancelledCount,
      renewal_emails_sent: renewalEmailsSent,
      grace_expired_downgraded: graceExpiredCount,
      warnings_sent: warningsSent,
    });
  } catch (error) {
    console.error('[check-subscription-expiry] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});

/**
 * Helper: fetch handwerker profile + email for a user
 */
async function fetchUserInfo(supabase: any, userId: string) {
  const [profileResult, emailResult] = await Promise.all([
    supabase
      .from('handwerker_profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single(),
  ]);

  return {
    profile: profileResult.data,
    email: emailResult.data?.email,
  };
}
