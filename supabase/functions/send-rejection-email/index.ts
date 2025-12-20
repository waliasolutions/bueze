import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { rejectionNotificationTemplate } from '../_shared/emailTemplates.ts';

interface RejectionEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  reason?: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const requestData: RejectionEmailRequest = await req.json();
    
    console.log('Sending rejection email to:', requestData.email);
    
    // Validate required fields
    if (!requestData.email || !requestData.firstName || !requestData.lastName) {
      throw new Error('Missing required fields: email, firstName, lastName');
    }

    const htmlBody = rejectionNotificationTemplate({
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      companyName: requestData.companyName,
      reason: requestData.reason,
      email: requestData.email,
    });

    const result = await sendEmail({
      to: requestData.email,
      subject: 'Ihre Registrierung bei Büeze.ch',
      htmlBody: htmlBody,
    });

    console.log('Rejection email sent:', result.success);

    return successResponse({ 
      success: true,
      message: 'Rejection email sent successfully',
    });

  } catch (error) {
    console.error('Error in send-rejection-email:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});
