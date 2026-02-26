import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { ratingReminderTemplate } from '../_shared/emailTemplates.ts';

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

    console.log("[send-rating-reminder] Starting rating reminder check...");

    // Find accepted proposals from ~7 days ago that haven't been rated yet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Get proposals accepted between 7-8 days ago
    const { data: proposals, error: proposalsError } = await supabase
      .from('lead_proposals')
      .select(`
        id,
        lead_id,
        handwerker_id,
        responded_at,
        leads (
          id,
          title,
          owner_id
        )
      `)
      .eq('status', 'accepted')
      .gte('responded_at', eightDaysAgo.toISOString())
      .lt('responded_at', sevenDaysAgo.toISOString());

    if (proposalsError) {
      console.error("[send-rating-reminder] Error fetching proposals:", proposalsError);
      throw proposalsError;
    }

    console.log(`[send-rating-reminder] Found ${proposals?.length || 0} proposals to check for rating reminders`);

    let emailsSent = 0;
    let skipped = 0;

    for (const proposal of proposals || []) {
      const leadId = proposal.lead_id;

      // Check if a review already exists for this lead
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (existingReview) {
        console.log(`[send-rating-reminder] Review already exists for lead ${leadId}, skipping`);
        skipped++;
        continue;
      }

      // Get client details separately (no FK join)
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name, first_name, email')
        .eq('id', proposal.leads?.owner_id)
        .single();

      if (!clientProfile?.email) {
        console.log(`[send-rating-reminder] No email for client on lead ${leadId}, skipping`);
        skipped++;
        continue;
      }

      // Get handwerker details separately
      const { data: handwerkerProfile } = await supabase
        .from('handwerker_profiles')
        .select('first_name, last_name, company_name')
        .eq('user_id', proposal.handwerker_id)
        .single();

      const handwerkerName = handwerkerProfile?.company_name ||
        `${handwerkerProfile?.first_name || ''} ${handwerkerProfile?.last_name || ''}`.trim() ||
        'Ihren Handwerker';

      const clientName = clientProfile.first_name || clientProfile.full_name || 'Kunde';
      const projectTitle = proposal.leads?.title || 'Ihr Projekt';

      // Create magic token for rating link
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to rate

      await supabase.from('magic_tokens').insert({
        token,
        resource_type: 'rating',
        resource_id: leadId,
        user_id: proposal.leads?.owner_id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          lead_id: leadId,
          handwerker_id: proposal.handwerker_id,
          proposal_id: proposal.id
        }
      });

      const ratingLink = `https://bueeze.ch/dashboard?rating=${leadId}`;

      const emailHtml = ratingReminderTemplate({
        clientName,
        projectTitle,
        handwerkerName,
        ratingLink
      });

      try {
        console.log(`[send-rating-reminder] Sending reminder to ${clientProfile.email}`);

        const emailResult = await sendEmail({
          to: clientProfile.email,
          subject: `⭐ Wie war ${handwerkerName}? Ihre Bewertung zählt!`,
          htmlBody: emailHtml,
        });

        if (emailResult.success) {
          console.log(`[send-rating-reminder] Rating reminder sent to ${clientProfile.email} for lead ${leadId}`);
          emailsSent++;
        } else {
          console.error(`[send-rating-reminder] Failed to send email to ${clientProfile.email}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error(`[send-rating-reminder] Failed to send email to ${clientProfile.email}:`, emailError);
      }
    }

    console.log(`[send-rating-reminder] Complete: ${emailsSent} emails sent, ${skipped} skipped`);

    return successResponse({
      success: true,
      emailsSent,
      skipped,
      message: `Sent ${emailsSent} rating reminder emails`
    });
  } catch (error: any) {
    console.error("[send-rating-reminder] Error:", error);

    // Create admin notification for function failure
    try {
      const supabase = createSupabaseAdmin();

      await supabase.from('admin_notifications').insert({
        type: 'scheduled_function_error',
        title: 'Rating Reminder fehlgeschlagen',
        message: `Die geplante Funktion send-rating-reminder ist fehlgeschlagen: ${error.message}`,
        metadata: {
          function_name: 'send-rating-reminder',
          error_message: error.message,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (notifError) {
      console.error("[send-rating-reminder] Failed to create admin notification:", notifError);
    }

    return errorResponse(error.message, 500);
  }
});
