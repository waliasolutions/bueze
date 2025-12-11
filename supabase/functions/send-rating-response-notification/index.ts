import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { ratingResponseClientTemplate } from '../_shared/emailTemplates.ts';

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

    // Fetch review with lead and handwerker details
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
      return new Response(
        JSON.stringify({ success: true, message: 'No response to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get client (reviewer) and handwerker profiles
    const [clientResult, handwerkerProfileResult] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', review.reviewer_id).single(),
      supabase.from('handwerker_profiles').select('company_name, profiles!handwerker_profiles_user_id_fkey(full_name)').eq('user_id', review.reviewed_id).single()
    ]);

    if (!clientResult.data?.email) {
      console.log('Client email not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No client email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const handwerkerName = handwerkerProfileResult.data?.company_name || 
                          handwerkerProfileResult.data?.profiles?.full_name || 
                          'Der Handwerker';
    const reviewLink = `https://bueeze.ch/dashboard`;

    const emailHtml = ratingResponseClientTemplate({
      clientName: clientResult.data.full_name || 'Kunde',
      handwerkerName,
      projectTitle: review.leads?.title || 'Projekt',
      responseText: review.handwerker_response,
      reviewLink,
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [clientResult.data.email],
        subject: `${handwerkerName} hat auf Ihre Bewertung geantwortet - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Rating response notification sent:', { reviewId, clientEmail: clientResult.data.email });

    return new Response(
      JSON.stringify({ success: true, message: 'Rating response notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-rating-response-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
