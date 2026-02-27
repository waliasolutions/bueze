import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  liability_insurance: 'Haftpflichtversicherung',
  professional_insurance: 'Berufshaftpflichtversicherung',
  trade_license: 'Gewerbebewilligung',
  certification: 'Zertifizierung',
  master_certificate: 'Meisterbrief',
  safety_certification: 'Sicherheitszertifikat',
  other: 'Dokument',
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

    const { data: expiringDocs, error: fetchError } = await supabase
      .from('expiring_documents')
      .select('id, user_id, email, first_name, last_name, company_name, document_type, document_name, expiry_date, expiry_status, reminder_7_sent, reminder_14_sent, reminder_30_sent')
      .in('expiry_status', ['expiring_30', 'expiring_14', 'expiring_7', 'expired'])
      .not('email', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`Found ${expiringDocs?.length || 0} documents to check for reminders`);

    const results = { sent: 0, skipped: 0, errors: 0 };

    for (const doc of expiringDocs || []) {
      let shouldSend = false, reminderType = '', updateField = '';

      if (doc.expiry_status === 'expired' && !doc.reminder_7_sent) {
        shouldSend = true; reminderType = 'expired'; updateField = 'reminder_7_sent';
      } else if (doc.expiry_status === 'expiring_7' && !doc.reminder_7_sent) {
        shouldSend = true; reminderType = '7'; updateField = 'reminder_7_sent';
      } else if (doc.expiry_status === 'expiring_14' && !doc.reminder_14_sent) {
        shouldSend = true; reminderType = '14'; updateField = 'reminder_14_sent';
      } else if (doc.expiry_status === 'expiring_30' && !doc.reminder_30_sent) {
        shouldSend = true; reminderType = '30'; updateField = 'reminder_30_sent';
      }

      if (!shouldSend) { results.skipped++; continue; }

      const userName = doc.company_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || 'Handwerker';
      const documentLabel = DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_name;
      const expiryDate = new Date(doc.expiry_date).toLocaleDateString('de-CH');

      let subject = '', urgencyText = '';
      if (reminderType === 'expired') {
        subject = `⚠️ Ihr ${documentLabel} ist abgelaufen`;
        urgencyText = `Ihr ${documentLabel} ist am ${expiryDate} abgelaufen. Bitte laden Sie umgehend ein aktuelles Dokument hoch.`;
      } else if (reminderType === '7') {
        subject = `🚨 Dringend: Ihr ${documentLabel} läuft in 7 Tagen ab`;
        urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab – das ist in nur 7 Tagen!`;
      } else if (reminderType === '14') {
        subject = `⏰ Erinnerung: Ihr ${documentLabel} läuft in 14 Tagen ab`;
        urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab.`;
      } else {
        subject = `📋 Ihr ${documentLabel} läuft in 30 Tagen ab`;
        urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab.`;
      }

      const result = await sendEmail({
        to: doc.email,
        subject,
        textBody: `Hallo ${userName},\n\n${urgencyText}\n\nBitte aktualisieren Sie Ihr Dokument: ${FRONTEND_URL}/handwerker-profile-edit\n\nIhr Büeze.ch Team`,
      });

      if (result.success) {
        await supabase.from('handwerker_documents').update({ [updateField]: true }).eq('id', doc.id);
        await supabase.from('handwerker_notifications').insert({
          user_id: doc.user_id,
          type: 'document_expiry',
          title: reminderType === 'expired' ? `${documentLabel} abgelaufen` : `${documentLabel} läuft bald ab`,
          message: urgencyText,
          metadata: { document_id: doc.id, document_type: doc.document_type, expiry_date: doc.expiry_date },
        });
        results.sent++;
      } else {
        results.errors++;
      }
    }

    console.log('Document expiry reminder job completed:', results);
    return successResponse({ success: true, message: 'Document expiry reminders processed', results });
  } catch (error) {
    console.error('Error in document-expiry-reminder:', error);
    return errorResponse(error);
  }
});
