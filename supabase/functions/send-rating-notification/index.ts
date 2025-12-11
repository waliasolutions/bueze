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

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        leads!reviews_lead_id_fkey(title)
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error(`Review not found: ${reviewError?.message}`);
    }

    // Get reviewer (client) and reviewed (handwerker) profiles
    const [reviewerResult, handwerkerProfileResult] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', review.reviewer_id).single(),
      supabase.from('handwerker_profiles').select('user_id, profiles!handwerker_profiles_user_id_fkey(email, full_name)').eq('user_id', review.reviewed_id).single()
    ]);

    if (!handwerkerProfileResult.data?.profiles?.email) {
      console.log('Handwerker email not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No handwerker email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const clientFirstName = (reviewerResult.data?.full_name || 'Ein Kunde').split(' ')[0];
    const profileLink = `https://bueeze.ch/handwerker-dashboard`;

    const emailHtml = ratingReceivedHandwerkerTemplate({
      handwerkerName: handwerkerProfileResult.data.profiles.full_name || 'Handwerker',
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
        to: [handwerkerProfileResult.data.profiles.email],
        subject: `⭐ Neue Bewertung (${review.rating}/5) erhalten - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Rating notification sent:', { reviewId, handwerkerEmail: handwerkerProfileResult.data.profiles.email });

    return new Response(
      JSON.stringify({ success: true, message: 'Rating notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-rating-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
