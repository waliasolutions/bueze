import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile } from '../_shared/profileHelpers.ts';
import { ratingReceivedHandwerkerTemplate } from '../_shared/emailTemplates.ts';

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
    const profileLink = `https://bueeze.ch/handwerker-dashboard`;

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

    console.log('[send-rating-notification] Rating notification sent successfully:', { 
      reviewId, 
      handwerkerEmail: handwerkerProfile.email,
      rating: review.rating
    });

    return successResponse({ success: true, message: 'Rating notification sent' });
  } catch (error) {
    console.error('[send-rating-notification] Error:', error);
    return errorResponse(error);
  }
});
