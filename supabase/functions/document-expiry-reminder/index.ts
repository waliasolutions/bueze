import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpiringDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  expiry_date: string;
  expiry_status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  reminder_30_sent: boolean;
  reminder_14_sent: boolean;
  reminder_7_sent: boolean;
}

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');

    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch documents expiring within 30 days that haven't been reminded yet
    const { data: expiringDocs, error: fetchError } = await supabase
      .from('expiring_documents')
      .select('*')
      .in('expiry_status', ['expiring_30', 'expiring_14', 'expiring_7', 'expired'])
      .not('email', 'is', null);

    if (fetchError) {
      console.error('Error fetching expiring documents:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringDocs?.length || 0} documents to check for reminders`);

    const results = {
      sent: 0,
      skipped: 0,
      errors: 0,
    };

    for (const doc of expiringDocs || []) {
      const typedDoc = doc as ExpiringDocument;
      
      // Determine which reminder to send
      let shouldSend = false;
      let reminderType = '';
      let updateField = '';

      if (typedDoc.expiry_status === 'expired') {
        // For expired documents, we send a final reminder if 7-day wasn't sent
        if (!typedDoc.reminder_7_sent) {
          shouldSend = true;
          reminderType = 'expired';
          updateField = 'reminder_7_sent';
        }
      } else if (typedDoc.expiry_status === 'expiring_7' && !typedDoc.reminder_7_sent) {
        shouldSend = true;
        reminderType = '7';
        updateField = 'reminder_7_sent';
      } else if (typedDoc.expiry_status === 'expiring_14' && !typedDoc.reminder_14_sent) {
        shouldSend = true;
        reminderType = '14';
        updateField = 'reminder_14_sent';
      } else if (typedDoc.expiry_status === 'expiring_30' && !typedDoc.reminder_30_sent) {
        shouldSend = true;
        reminderType = '30';
        updateField = 'reminder_30_sent';
      }

      if (!shouldSend) {
        results.skipped++;
        continue;
      }

      try {
        const userName = typedDoc.company_name || 
          `${typedDoc.first_name || ''} ${typedDoc.last_name || ''}`.trim() || 
          'Handwerker';
        
        const documentLabel = DOCUMENT_TYPE_LABELS[typedDoc.document_type] || typedDoc.document_name;
        const expiryDate = new Date(typedDoc.expiry_date).toLocaleDateString('de-CH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        let subject = '';
        let urgencyText = '';

        if (reminderType === 'expired') {
          subject = `⚠️ Ihr ${documentLabel} ist abgelaufen`;
          urgencyText = `Ihr ${documentLabel} ist am ${expiryDate} abgelaufen. Bitte laden Sie umgehend ein aktuelles Dokument hoch, um Ihr Profil aktiv zu halten.`;
        } else if (reminderType === '7') {
          subject = `🚨 Dringend: Ihr ${documentLabel} läuft in 7 Tagen ab`;
          urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab – das ist in nur 7 Tagen! Bitte laden Sie rechtzeitig ein neues Dokument hoch.`;
        } else if (reminderType === '14') {
          subject = `⏰ Erinnerung: Ihr ${documentLabel} läuft in 14 Tagen ab`;
          urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab. Bitte kümmern Sie sich zeitnah um die Erneuerung.`;
        } else {
          subject = `📋 Ihr ${documentLabel} läuft in 30 Tagen ab`;
          urgencyText = `Ihr ${documentLabel} läuft am ${expiryDate} ab. Wir empfehlen, frühzeitig ein aktuelles Dokument hochzuladen.`;
        }

        const body = `Hallo ${userName},

${urgencyText}

So aktualisieren Sie Ihr Dokument:
1. Melden Sie sich bei Büeze.ch an
2. Gehen Sie zu Ihrem Profil → Dokumente & Versicherung
3. Laden Sie das neue ${documentLabel} hoch

Hier geht's direkt zu Ihrem Profil:
https://bueeze.ch/handwerker-profile-edit

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüssen
Ihr Büeze.ch Team`;

        const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          body: JSON.stringify({
            sender: 'noreply@bueeze.ch',
            to: [typedDoc.email],
            subject: subject,
            text_body: body,
          }),
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json();
          console.error(`Failed to send email for document ${typedDoc.id}:`, emailError);
          results.errors++;
          continue;
        }

        // Update the reminder flag
        const { error: updateError } = await supabase
          .from('handwerker_documents')
          .update({ [updateField]: true })
          .eq('id', typedDoc.id);

        if (updateError) {
          console.error(`Failed to update reminder flag for document ${typedDoc.id}:`, updateError);
        }

        console.log(`Sent ${reminderType}-day reminder for document ${typedDoc.id} to ${typedDoc.email}`);
        results.sent++;

        // Also create an in-app notification
        await supabase.from('handwerker_notifications').insert({
          user_id: typedDoc.user_id,
          type: 'document_expiry',
          title: reminderType === 'expired' 
            ? `${documentLabel} abgelaufen` 
            : `${documentLabel} läuft bald ab`,
          message: reminderType === 'expired'
            ? `Ihr ${documentLabel} ist abgelaufen. Bitte laden Sie ein aktuelles Dokument hoch.`
            : `Ihr ${documentLabel} läuft am ${expiryDate} ab.`,
          metadata: {
            document_id: typedDoc.id,
            document_type: typedDoc.document_type,
            expiry_date: typedDoc.expiry_date,
            days_until_expiry: reminderType,
          },
        });

      } catch (emailError) {
        console.error(`Error sending reminder for document ${typedDoc.id}:`, emailError);
        results.errors++;
      }
    }

    console.log('Document expiry reminder job completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document expiry reminders processed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in document-expiry-reminder:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
