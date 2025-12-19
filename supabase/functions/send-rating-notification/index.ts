import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { ratingReceivedHandwerkerTemplate } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId } = await req.json();
    
    if (!reviewId) {
      throw new Error('Missing required field: reviewId');
    }

    console.log(`[send-rating-notification] Processing review: ${reviewId}`);

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch review with lead details
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

    // Step 2: Fetch reviewer (client) profile separately
    const { data: reviewerProfile, error: reviewerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', review.reviewer_id)
      .single();

    if (reviewerError) {
      console.warn(`[send-rating-notification] Could not fetch reviewer profile: ${reviewerError.message}`);
    }

    // Step 3: Fetch handwerker profile separately
    const { data: handwerkerProfile, error: hwProfileError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, first_name, last_name, company_name')
      .eq('user_id', review.reviewed_id)
      .single();

    if (hwProfileError) {
      console.warn(`[send-rating-notification] Could not fetch handwerker profile: ${hwProfileError.message}`);
    }

    // Step 4: Fetch handwerker's email from profiles table
    const { data: hwEmailProfile, error: hwEmailError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', review.reviewed_id)
      .single();

    if (hwEmailError || !hwEmailProfile?.email) {
      console.log('[send-rating-notification] Handwerker email not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No handwerker email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const clientFirstName = (reviewerProfile?.full_name || 'Ein Kunde').split(' ')[0];
    const handwerkerName = handwerkerProfile?.company_name || 
      `${handwerkerProfile?.first_name || ''} ${handwerkerProfile?.last_name || ''}`.trim() ||
      hwEmailProfile.full_name || 'Handwerker';
    const profileLink = `https://bueeze.ch/handwerker-dashboard`;

    console.log(`[send-rating-notification] Sending notification to ${hwEmailProfile.email}`);

    const emailHtml = ratingReceivedHandwerkerTemplate({
      handwerkerName,
      clientFirstName,
      projectTitle: review.leads?.title || 'Projekt',
      rating: review.rating,
      comment: review.comment,
      profileLink,
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [hwEmailProfile.email],
        subject: `⭐ Neue Bewertung (${review.rating}/5) erhalten - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('[send-rating-notification] Email sending failed:', emailData);
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('[send-rating-notification] Rating notification sent successfully:', { 
      reviewId, 
      handwerkerEmail: hwEmailProfile.email,
      rating: review.rating
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Rating notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[send-rating-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
