import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { toZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";
import { adminRegistrationNotificationTemplate } from "../_shared/emailTemplates.ts";

const SWISS_TIMEZONE = 'Europe/Zurich';

/**
 * Format date/time in Swiss timezone with automatic DST handling
 */
function formatSwissDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const swissDate = toZonedTime(dateObj, SWISS_TIMEZONE);
  return format(swissDate, 'dd.MM.yyyy HH:mm', { timeZone: SWISS_TIMEZONE });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log('Processing admin notification for profile:', profileId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the handwerker profile
    const { data: profile, error: profileError } = await supabase
      .from('handwerker_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Profile not found');
    }

    console.log('Profile fetched:', {
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email
    });

    // Prepare email data
    const emailData = {
      firstName: profile.first_name || 'N/A',
      lastName: profile.last_name || 'N/A',
      email: profile.email || 'N/A',
      phone: profile.phone_number || 'N/A',
      companyName: profile.company_name || '',
      categories: profile.categories || [],
      serviceAreas: profile.service_areas || [],
      logoUrl: profile.logo_url || '',
      businessAddress: profile.business_address || '',
      profileId: profile.id,
      submittedAt: formatSwissDateTime(profile.created_at)
    };

    // Generate email HTML
    const emailHtml = adminRegistrationNotificationTemplate(emailData);

    // Send email via SMTP2GO
    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const emailPayload = {
      api_key: smtp2goApiKey,
      to: ['info@walia-solutions.ch'],
      cc: ['info@bueeze.ch'],
      sender: 'noreply@bueeze.ch',
      subject: `Neue Handwerker-Registrierung: ${profile.first_name} ${profile.last_name}`,
      html_body: emailHtml,
    };

    console.log('Sending email to info@walia-solutions.ch');

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('SMTP2GO error:', emailResult);
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin notification sent successfully',
        emailResult 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-admin-registration-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
