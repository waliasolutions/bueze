import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile } from '../_shared/profileHelpers.ts';
import { ratingReceivedHandwerkerTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { reviewId } = await req.json();
    
    if (!reviewId) {
      throw new Error('Missing required field: reviewId');
    }

    console.log(`[send-rating-notification] Processing review: ${reviewId}`);

    const supabase = createSupabaseAdmin();

    // Fetch review with lead details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        reviewer_id,
        reviewed_id,
        lead_id,
        leads(title)
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error(`Review not found: ${reviewError?.message}`);
    }

    console.log(`[send-rating-notification] Review found for lead: ${review.lead_id}`);

    // Fetch profiles using shared helpers
    const reviewerProfile = await fetchClientProfile(supabase, review.reviewer_id);
    const handwerkerProfile = await fetchHandwerkerProfile(supabase, review.reviewed_id);

    if (!handwerkerProfile?.email) {
      console.log('[send-rating-notification] Handwerker email not found, skipping notification');
      return successResponse({ success: true, message: 'No handwerker email' });
    }

    const clientFirstName = (reviewerProfile?.fullName || 'Ein Kunde').split(' ')[0];
    const profileLink = `${FRONTEND_URL}/handwerker-dashboard`;

    console.log(`[send-rating-notification] Sending notification to ${handwerkerProfile.email}`);

    const emailHtml = ratingReceivedHandwerkerTemplate({
      handwerkerName: handwerkerProfile.fullName,
      clientFirstName,
      projectTitle: review.leads?.title || 'Projekt',
      rating: review.rating,
      comment: review.comment,
      profileLink,
    });

    const result = await sendEmail({
      to: handwerkerProfile.email,
      subject: `⭐ Neue Bewertung (${review.rating}/5) erhalten - Büeze.ch`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('[send-rating-notification] Email notification sent successfully:', { 
      reviewId, 
      handwerkerEmail: handwerkerProfile.email,
      rating: review.rating
    });

    // Insert in-app notification for handwerker
    const { error: notifError } = await supabase.from('handwerker_notifications').insert({
      user_id: review.reviewed_id,
      type: 'new_review',
      title: 'Neue Bewertung erhalten',
      message: `${clientFirstName} hat Sie mit ${review.rating} Sternen bewertet`,
      related_id: reviewId,
      metadata: { 
        lead_id: review.lead_id,
        rating: review.rating
      }
    });

    if (notifError) {
      console.error('[send-rating-notification] Failed to create in-app notification:', notifError);
    } else {
      console.log('[send-rating-notification] Handwerker in-app notification created');
    }

    return successResponse({ success: true, message: 'Rating notification sent' });
  } catch (error) {
    console.error('[send-rating-notification] Error:', error);
    return errorResponse(error);
  }
});
