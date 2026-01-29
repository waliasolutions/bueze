// Edge function: send-pending-payment-reminder
// Sends payment reminders to approved handwerkers with pending paid plans
// Runs daily via cron job

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createSupabaseAdmin, getSupabaseUrl } from '../_shared/supabaseClient.ts';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';

// Plan display names in German
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  monthly: 'Monatlich (CHF 90/Monat)',
  '6_month': '6 Monate (CHF 510)',
  annual: 'Jährlich (CHF 960)',
};

interface HandwerkerWithPendingPlan {
  id: string;
  user_id: string;
  pending_plan: string;
  payment_reminder_1_sent: boolean;
  payment_reminder_2_sent: boolean;
  handwerker_profile: {
    verified_at: string | null;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
  };
}

function getCheckoutUrl(plan: string): string {
  const baseUrl = 'https://bueze.lovable.app';
  return `${baseUrl}/checkout?plan=${plan}`;
}

function getCancelPendingPlanUrl(): string {
  return 'https://bueze.lovable.app/profile';
}

function getFirstReminderEmailHtml(
  name: string,
  planName: string,
  checkoutUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #f97316; margin-bottom: 10px;">Büeze.ch</h1>
  </div>
  
  <h2 style="color: #1f2937;">Hallo ${name},</h2>
  
  <p>Vor 2 Tagen wurde Ihr Handwerker-Profil freigeschaltet – herzlichen Glückwunsch! 🎉</p>
  
  <p>Sie haben sich für das <strong>${planName}</strong> entschieden, aber die Zahlung steht noch aus.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Mit Ihrem gewählten Abo erhalten Sie:</strong></p>
    <p style="margin: 5px 0;">✅ Unbegrenzte Offerten pro Monat</p>
    <p style="margin: 5px 0;">✅ Sofortigen Zugang zu allen Aufträgen</p>
    <p style="margin: 5px 0;">✅ Mehr Chancen auf neue Kunden</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${checkoutUrl}" style="display: inline-block; background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Jetzt bezahlen und starten
    </a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px;">
    Oder starten Sie kostenlos mit 5 Offerten pro Monat.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #6b7280; font-size: 14px;">
    Bei Fragen: <a href="mailto:info@bueeze.ch" style="color: #f97316;">info@bueeze.ch</a>
  </p>
  
  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
    Ihr Büeze.ch Team
  </p>
</body>
</html>
`;
}

function getFinalReminderEmailHtml(
  name: string,
  planName: string,
  checkoutUrl: string,
  cancelUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #f97316; margin-bottom: 10px;">Büeze.ch</h1>
  </div>
  
  <h2 style="color: #1f2937;">Hallo ${name},</h2>
  
  <p>Ihr Handwerker-Profil ist seit einer Woche aktiv, aber Ihr gewähltes <strong>${planName}</strong> wartet noch auf die Aktivierung.</p>
  
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
    <p style="margin: 0; color: #92400e;">
      ⏰ <strong>Letzte Erinnerung:</strong> Während Sie warten, gewinnen andere Handwerker bereits neue Aufträge. Sichern Sie sich Ihren Wettbewerbsvorteil!
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${checkoutUrl}" style="display: inline-block; background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Jetzt Abo aktivieren
    </a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Nicht interessiert? <a href="${cancelUrl}" style="color: #f97316;">Ausstehenden Plan stornieren</a> und kostenlos weitermachen.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #6b7280; font-size: 14px;">
    Bei Fragen: <a href="mailto:info@bueeze.ch" style="color: #f97316;">info@bueeze.ch</a>
  </p>
  
  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
    Ihr Büeze.ch Team
  </p>
</body>
</html>
`;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    
    console.log('Starting pending payment reminder check...');

    // Query handwerker_subscriptions with pending_plan, still on free tier
    // Join with handwerker_profiles to get verified_at and contact info
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
      return errorResponse(`Failed to fetch subscriptions: ${subError.message}`, 500);
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

        const planName = PLAN_DISPLAY_NAMES[sub.pending_plan] || sub.pending_plan;
        const checkoutUrl = getCheckoutUrl(sub.pending_plan);
        const cancelUrl = getCancelPendingPlanUrl();

        // First reminder: 48+ hours after approval, not yet sent
        if (hoursSinceApproval >= 48 && !sub.payment_reminder_1_sent) {
          console.log(`Sending first reminder to ${email}`);
          
          const emailResult = await sendEmail({
            to: email,
            subject: '💳 Vergessen? Ihr Abo wartet auf Sie - Büeze.ch',
            htmlBody: getFirstReminderEmailHtml(name, planName, checkoutUrl),
          });

          if (emailResult.success) {
            // Mark reminder as sent
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
            htmlBody: getFinalReminderEmailHtml(name, planName, checkoutUrl, cancelUrl),
          });

          if (emailResult.success) {
            // Mark reminder as sent
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
