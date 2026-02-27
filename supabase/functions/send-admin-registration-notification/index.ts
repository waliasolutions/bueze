import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { adminRegistrationNotificationTemplate } from '../_shared/emailTemplates.ts';
import { formatSwissDateTime } from '../_shared/dateFormatter.ts';
import { SUPPORT_EMAIL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { profileId } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log('Processing admin notification for profile:', profileId);

    const supabase = createSupabaseAdmin();

    // Fetch the handwerker profile
    const { data: profile, error: profileError } = await supabase
      .from('handwerker_profiles')
      .select('id, first_name, last_name, email, phone_number, company_name, categories, service_areas, logo_url, business_address, created_at')
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

    console.log('Sending admin notification email to:', SUPPORT_EMAIL);

    const result = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `Neue Handwerker-Registrierung: ${profile.first_name} ${profile.last_name}`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Email sent successfully');

    return successResponse({ 
      success: true, 
      message: 'Admin notification sent successfully',
    });
  } catch (error) {
    console.error('Error in send-admin-registration-notification:', error);
    return errorResponse(error, 500);
  }
});
