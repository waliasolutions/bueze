import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile } from '../_shared/profileHelpers.ts';
import { ratingResponseClientTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { reviewId } = await req.json();
    
    if (!reviewId) {
      throw new Error('Missing required field: reviewId');
    }

    console.log(`[send-rating-response-notification] Processing review: ${reviewId}`);

    const supabase = createSupabaseAdmin();

    // Fetch review with handwerker response and lead details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        id,
        handwerker_response,
        reviewer_id,
        reviewed_id,
        lead_id,
        leads!reviews_lead_id_fkey(title)
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error(`Review not found: ${reviewError?.message}`);
    }

    if (!review.handwerker_response) {
      console.log('No handwerker response found, skipping notification');
      return successResponse({ success: true, message: 'No response to notify' });
    }

    // Fetch profiles using shared helpers
    const clientProfile = await fetchClientProfile(supabase, review.reviewer_id);
    const handwerkerProfile = await fetchHandwerkerProfile(supabase, review.reviewed_id);

    if (!clientProfile?.email) {
      console.log('Client email not found, skipping notification');
      return successResponse({ success: true, message: 'No client email' });
    }

    const handwerkerName = handwerkerProfile?.fullName || 'Der Handwerker';
    const reviewLink = `${FRONTEND_URL}/dashboard`;

    console.log(`[send-rating-response-notification] Sending notification to ${clientProfile.email}`);

    const emailHtml = ratingResponseClientTemplate({
      clientName: clientProfile.fullName || 'Kunde',
      handwerkerName,
      projectTitle: (review.leads as any)?.title || 'Projekt',
      responseText: review.handwerker_response,
      reviewLink,
    });

    const result = await sendEmail({
      to: clientProfile.email,
      subject: `${handwerkerName} hat auf Ihre Bewertung geantwortet - Büeze.ch`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Rating response notification sent:', { reviewId, clientEmail: clientProfile.email });

    return successResponse({ success: true, message: 'Rating response notification sent' });
  } catch (error) {
    console.error('Error in send-rating-response-notification:', error);
    return errorResponse(error as Error);
  }
});
