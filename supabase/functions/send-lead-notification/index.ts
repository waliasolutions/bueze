import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { newLeadNotificationTemplate, newLeadAdminNotificationTemplate } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category labels for human-readable display
const categoryLabels: Record<string, string> = {
  'bau_renovation': 'Bau & Renovation',
  'elektroinstallationen': 'Elektroinstallationen',
  'heizung_klima': 'Heizung & Klima',
  'sanitaer': 'Sanitär',
  'bodenbelaege': 'Bodenbeläge',
  'innenausbau_schreiner': 'Innenausbau & Schreiner',
  'kueche': 'Küche',
  'garten_umgebung': 'Garten & Aussenbereich',
  'reinigung_hauswartung': 'Reinigung & Hauswartung',
  'raeumung_entsorgung': 'Räumung & Entsorgung',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    
    if (!leadId) {
      throw new Error('Missing required field: leadId');
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead details with owner profile
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, profiles!leads_owner_id_fkey(full_name, email)')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    const categoryLabel = categoryLabels[lead.category] || lead.category;

    // ==========================================
    // STEP 1: Send Admin Notification Email
    // ==========================================
    console.log('Sending admin notification email for new lead...');
    
    const adminEmailHtml = newLeadAdminNotificationTemplate({
      clientName: lead.profiles?.full_name || 'Unbekannt',
      clientEmail: lead.profiles?.email || 'Unbekannt',
      category: categoryLabel,
      city: lead.city || 'Nicht angegeben',
      canton: lead.canton || '',
      description: lead.description,
      budgetMin: lead.budget_min,
      budgetMax: lead.budget_max,
      urgency: lead.urgency || 'planning',
      leadId: lead.id,
      submittedAt: new Date(lead.created_at).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    });

    const adminEmailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: ['info@bueeze.ch'],
        subject: `Neuer Auftrag: ${categoryLabel} in ${lead.city}`,
        html_body: adminEmailHtml,
      }),
    });

    const adminEmailData = await adminEmailResponse.json();
    if (!adminEmailResponse.ok) {
      console.error('Admin notification email failed:', adminEmailData);
    } else {
      console.log('Admin notification email sent successfully to info@bueeze.ch');
    }

    // ==========================================
    // STEP 2: Send Handwerker Notifications
    // ==========================================

    // Fetch matching handwerkers
    const { data: handwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, profiles!handwerker_profiles_user_id_fkey(email, full_name), service_areas, categories')
      .eq('verification_status', 'approved')
      .contains('categories', [lead.category]);

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    console.log(`Found ${handwerkers?.length || 0} potential handwerkers for category ${lead.category}`);

    // Filter by service area (PLZ matching with range support)
    const leadPLZ = parseInt(lead.zip?.toString() || lead.postal_code?.toString() || '0');
    
    const matchingHandwerkers = handwerkers?.filter(hw => {
      if (!hw.service_areas || hw.service_areas.length === 0) return false;
      
      return hw.service_areas.some((area: string) => {
        // Handle range: "8000-8099"
        if (area.includes('-')) {
          const [start, end] = area.split('-').map(p => parseInt(p.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            return leadPLZ >= start && leadPLZ <= end;
          }
        }
        
        // Handle single PLZ: "8000"
        const servicePLZ = parseInt(area.trim());
        if (!isNaN(servicePLZ)) {
          return leadPLZ === servicePLZ;
        }
        
        return false;
      });
    }) || [];

    console.log(`${matchingHandwerkers.length} handwerkers match service area for PLZ ${leadPLZ}`);

    // Generate magic tokens and send emails
    let successCount = 0;
    let errorCount = 0;

    for (const hw of matchingHandwerkers) {
      try {
        // Generate magic token
        const token = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Store magic token
        const { error: tokenError } = await supabase
          .from('magic_tokens')
          .insert({
            token,
            user_id: hw.user_id,
            resource_type: 'lead',
            resource_id: leadId,
            expires_at: expiresAt.toISOString(),
          });

        if (tokenError) {
          console.error(`Failed to create token for user ${hw.user_id}:`, tokenError);
          errorCount++;
          continue;
        }

        // Create magic link
        const magicLink = `https://bueeze.ch/opportunity/${leadId}?token=${token}`;

        // Send email
        const emailHtml = newLeadNotificationTemplate({
          category: categoryLabel,
          city: lead.city || 'Nicht angegeben',
          description: lead.description,
          budgetMin: lead.budget_min,
          budgetMax: lead.budget_max,
          urgency: lead.urgency || 'normal',
          magicLink,
          handwerkerName: hw.profiles?.full_name || 'Handwerker',
        });

        const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          body: JSON.stringify({
            sender: 'noreply@bueeze.ch',
            to: [hw.profiles?.email],
            subject: `Neue Anfrage in ${categoryLabel} - ${lead.city}`,
            html_body: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error(`Email failed for ${hw.profiles?.email}:`, emailData);
          errorCount++;
        } else {
          console.log(`Email sent successfully to ${hw.profiles?.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing handwerker ${hw.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`Email sending complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin notified, ${successCount} handwerkers notified`,
        successCount,
        errorCount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-lead-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
