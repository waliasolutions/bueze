// Edge function: send-invoice-email
// Sends an invoice email with PDF attachment to the handwerker.
// Called by generate-invoice-pdf with billingSnapshot as parameter,
// or manually triggered for resends (reads snapshot from DB).

import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { invoiceEmailTemplate } from '../_shared/emailTemplates.ts';
import { getPlanName } from '../_shared/planLabels.ts';
import { formatSwissDate } from '../_shared/dateFormatter.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.190.0/encoding/base64.ts';
import { fetchBillingSettings, type BillingSettings } from '../_shared/companyConfig.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { invoiceId, billingSnapshot: snapshotFromParam } = await req.json();

    if (!invoiceId) {
      return errorResponse('Missing required field: invoiceId', 400);
    }

    const supabase = createSupabaseAdmin();

    // 1. Fetch invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return errorResponse('Invoice not found', 404);
    }

    if (!invoice.pdf_storage_path) {
      return errorResponse('Invoice PDF not yet generated', 400);
    }

    // 2. Resolve billing snapshot: parameter > invoice record > live settings
    let companyData: BillingSettings;
    if (snapshotFromParam) {
      companyData = snapshotFromParam as BillingSettings;
    } else if (invoice.billing_snapshot) {
      companyData = invoice.billing_snapshot as BillingSettings;
    } else {
      // Fallback for old invoices without snapshot
      companyData = await fetchBillingSettings(supabase);
    }

    // 3. Fetch user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', invoice.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('User profile not found:', profileError);
      return errorResponse('User email not found', 404);
    }

    // 4. Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('invoices')
      .download(invoice.pdf_storage_path);

    if (downloadError || !pdfData) {
      console.error('Failed to download PDF:', downloadError);
      return errorResponse('Failed to download invoice PDF', 500);
    }

    // Convert to base64 for email attachment
    const arrayBuffer = await pdfData.arrayBuffer();
    const pdfBase64 = base64Encode(arrayBuffer);

    // 5. Format email data
    const planName = getPlanName(invoice.plan_type);
    const amountFormatted = `CHF ${(invoice.amount / 100).toFixed(2)}`;

    const emailHtml = invoiceEmailTemplate({
      customerName: invoice.billing_name || profile.full_name || 'Handwerker',
      invoiceNumber: invoice.invoice_number,
      issuedAt: formatSwissDate(invoice.issued_at),
      planName,
      amount: amountFormatted,
      currency: invoice.currency,
      periodStart: invoice.issued_at ? formatSwissDate(invoice.issued_at) : undefined,
      periodEnd: invoice.due_date ? formatSwissDate(invoice.due_date) : undefined,
    }, companyData);

    // 6. Send email with PDF attachment
    const emailResult = await sendEmail({
      to: profile.email,
      subject: `Rechnung ${invoice.invoice_number} – ${companyData.company_name}`,
      htmlBody: emailHtml,
      attachments: [{
        filename: `${invoice.invoice_number}.pdf`,
        fileblob: pdfBase64,
        mimetype: 'application/pdf',
      }],
    });

    if (!emailResult.success) {
      console.error('Failed to send invoice email:', emailResult.error);
      return errorResponse(`Failed to send email: ${emailResult.error}`, 500);
    }

    console.log(`Invoice email sent for ${invoice.invoice_number} to ${profile.email}`);

    return successResponse({ sent: true, invoiceNumber: invoice.invoice_number });

  } catch (error) {
    console.error('Send invoice email error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
