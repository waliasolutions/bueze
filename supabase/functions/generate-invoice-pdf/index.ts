// Edge function: generate-invoice-pdf
// Creates an invoice record, generates a PDF, and uploads it to Supabase Storage.
// Called from the payrexx-webhook after successful payment.

import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { generateInvoicePdf } from '../_shared/invoicePdf.ts';
import { getPlanName } from '../_shared/planLabels.ts';
import { formatSwissDate, addMonths } from '../_shared/dateFormatter.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { paymentId, userId, planType, amount } = await req.json();

    if (!userId || !planType || !amount) {
      return errorResponse('Missing required fields: userId, planType, amount', 400);
    }

    const supabase = createSupabaseAdmin();
    const now = new Date();

    // 1. Generate invoice number via SQL function
    const { data: invoiceNumResult, error: seqError } = await supabase
      .rpc('generate_invoice_number');

    if (seqError || !invoiceNumResult) {
      console.error('Failed to generate invoice number:', seqError);
      return errorResponse('Failed to generate invoice number', 500);
    }
    const invoiceNumber = invoiceNumResult as string;

    // 2. Fetch user profile + handwerker profile for billing snapshot
    const [profileResult, handwerkerResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single(),
      supabase
        .from('handwerker_profiles')
        .select('company_name, first_name, last_name, business_address, business_zip, business_city, personal_address, personal_zip, personal_city')
        .eq('user_id', userId)
        .single(),
    ]);

    const profile = profileResult.data;
    const hwProfile = handwerkerResult.data;

    // Build billing details from handwerker profile (prefer business, fallback to personal)
    const billingName = profile?.full_name || `${hwProfile?.first_name || ''} ${hwProfile?.last_name || ''}`.trim() || 'Kunde';
    const billingCompany = hwProfile?.company_name || null;
    const billingAddress = hwProfile?.business_address || hwProfile?.personal_address || null;
    const billingZip = hwProfile?.business_zip || hwProfile?.personal_zip || null;
    const billingCity = hwProfile?.business_city || hwProfile?.personal_city || null;

    // Calculate amounts (no MWST for Liechtenstein company selling to Swiss customers — simplified)
    const taxRate = 0;
    const netAmount = amount;
    const taxAmount = 0;
    const totalAmount = amount;

    // Determine subscription period
    const periodMonths: Record<string, number> = { monthly: 1, '6_month': 6, annual: 12 };
    const months = periodMonths[planType] || 1;
    const periodEnd = addMonths(now, months);

    const planName = getPlanName(planType);

    // 3. Insert invoice record (without pdf_storage_path — will update after upload)
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: userId,
        payment_id: paymentId || null,
        amount: totalAmount,
        currency: 'CHF',
        tax_rate: taxRate,
        tax_amount: taxAmount,
        net_amount: netAmount,
        plan_type: planType,
        status: 'paid',
        issued_at: now.toISOString(),
        due_date: now.toISOString(), // already paid
        paid_at: now.toISOString(),
        description: `${planName} Abonnement`,
        billing_name: billingName,
        billing_company: billingCompany,
        billing_address: billingAddress,
        billing_zip: billingZip,
        billing_city: billingCity,
      })
      .select('id')
      .single();

    if (insertError || !invoice) {
      console.error('Failed to insert invoice:', insertError);
      return errorResponse('Failed to create invoice record', 500);
    }

    // 4. Generate PDF bytes
    const pdfBytes = await generateInvoicePdf({
      invoiceNumber,
      issuedAt: now.toISOString(),
      dueDate: now.toISOString(),
      paidAt: now.toISOString(),
      billingName,
      billingCompany,
      billingAddress,
      billingZip,
      billingCity,
      planType,
      description: `${planName} Abonnement`,
      netAmount,
      taxRate,
      taxAmount,
      amount: totalAmount,
      currency: 'CHF',
      periodStart: now.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });

    // 5. Upload to Supabase Storage
    const storagePath = `${userId}/${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload invoice PDF:', uploadError);
      return errorResponse('Failed to upload invoice PDF', 500);
    }

    // 6. Update invoice with storage path (this triggers the email via DB trigger)
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ pdf_storage_path: storagePath })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Failed to update invoice with PDF path:', updateError);
    }

    console.log(`Invoice ${invoiceNumber} generated for user ${userId}, PDF uploaded to ${storagePath}`);

    return successResponse({
      invoiceId: invoice.id,
      invoiceNumber,
      storagePath,
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
