import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

/**
 * Scheduled function to detect orphaned records
 * Run via Supabase cron: daily at 3 AM
 * 
 * Detects:
 * - Profiles without corresponding auth users
 * - User roles without corresponding auth users
 * - Handwerker profiles with user_id that doesn't exist
 * - Subscriptions without corresponding auth users
 * - Notifications without corresponding auth users
 */

interface OrphanReport {
  orphaned_profiles: { id: string; email: string }[];
  orphaned_user_roles: { id: string; user_id: string }[];
  orphaned_handwerker_profiles: { id: string; email: string | null; user_id: string }[];
  orphaned_subscriptions: { id: string; user_id: string }[];
  orphaned_client_notifications: number;
  orphaned_handwerker_notifications: number;
  orphaned_reviews: number;
  orphaned_lead_proposals: number;
  orphaned_lead_views: number;
  orphaned_lead_purchases: number;
  orphaned_leads: number;
  orphaned_magic_tokens: number;
  orphaned_payment_history: number;
  orphaned_handwerker_documents: number;
  orphaned_messages: number;
  orphaned_conversations: number;
  total_orphans: number;
  scan_timestamp: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    console.log('[ORPHAN-CHECK] Starte Suche nach verwaisten Datensätzen...');

    const report: OrphanReport = {
      orphaned_profiles: [],
      orphaned_user_roles: [],
      orphaned_handwerker_profiles: [],
      orphaned_subscriptions: [],
      orphaned_client_notifications: 0,
      orphaned_handwerker_notifications: 0,
      orphaned_reviews: 0,
      orphaned_lead_proposals: 0,
      orphaned_lead_views: 0,
      orphaned_lead_purchases: 0,
      orphaned_leads: 0,
      orphaned_magic_tokens: 0,
      orphaned_payment_history: 0,
      orphaned_handwerker_documents: 0,
      orphaned_messages: 0,
      orphaned_conversations: 0,
      total_orphans: 0,
      scan_timestamp: new Date().toISOString(),
    };

    // Get all auth user IDs for comparison
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[ORPHAN-CHECK] Fehler beim Abrufen der Auth-Benutzer:', authError);
      throw new Error(`Fehler beim Abrufen der Auth-Benutzer: ${authError.message}`);
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    console.log(`[ORPHAN-CHECK] ${authUserIds.size} Auth-Benutzer gefunden`);

    // 1. Check for orphaned profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email');

    if (profiles) {
      for (const profile of profiles) {
        if (!authUserIds.has(profile.id)) {
          report.orphaned_profiles.push({ id: profile.id, email: profile.email });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_profiles.length} verwaiste Profile gefunden`);

    // 2. Check for orphaned user_roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('id, user_id');

    if (userRoles) {
      for (const role of userRoles) {
        if (!authUserIds.has(role.user_id)) {
          report.orphaned_user_roles.push({ id: role.id, user_id: role.user_id });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_user_roles.length} verwaiste user_roles gefunden`);

    // 3. Check for orphaned handwerker_profiles (with user_id that doesn't exist)
    const { data: hwProfiles } = await supabase
      .from('handwerker_profiles')
      .select('id, email, user_id')
      .not('user_id', 'is', null);

    if (hwProfiles) {
      for (const profile of hwProfiles) {
        if (profile.user_id && !authUserIds.has(profile.user_id)) {
          report.orphaned_handwerker_profiles.push({
            id: profile.id,
            email: profile.email,
            user_id: profile.user_id,
          });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_handwerker_profiles.length} verwaiste handwerker_profiles gefunden`);

    // 4. Check for orphaned subscriptions
    const { data: subscriptions } = await supabase
      .from('handwerker_subscriptions')
      .select('id, user_id');

    if (subscriptions) {
      for (const sub of subscriptions) {
        if (!authUserIds.has(sub.user_id)) {
          report.orphaned_subscriptions.push({ id: sub.id, user_id: sub.user_id });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_subscriptions.length} verwaiste Abonnements gefunden`);

    // 5. Count orphaned notifications (don't list all for brevity)
    const { data: clientNotifs } = await supabase
      .from('client_notifications')
      .select('user_id');

    if (clientNotifs) {
      report.orphaned_client_notifications = clientNotifs.filter(
        n => !authUserIds.has(n.user_id)
      ).length;
    }

    const { data: hwNotifs } = await supabase
      .from('handwerker_notifications')
      .select('user_id');

    if (hwNotifs) {
      report.orphaned_handwerker_notifications = hwNotifs.filter(
        n => !authUserIds.has(n.user_id)
      ).length;
    }

    // 6. Check for orphaned reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('reviewer_id, reviewed_id');

    if (reviews) {
      report.orphaned_reviews = reviews.filter(
        r => !authUserIds.has(r.reviewer_id) || !authUserIds.has(r.reviewed_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_reviews} verwaiste Bewertungen gefunden`);

    // 7. Check for orphaned lead_proposals
    const { data: proposals } = await supabase
      .from('lead_proposals')
      .select('handwerker_id');

    if (proposals) {
      report.orphaned_lead_proposals = proposals.filter(
        p => !authUserIds.has(p.handwerker_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_lead_proposals} verwaiste Offerten gefunden`);

    // 8. Check for orphaned lead_views
    const { data: leadViews } = await supabase
      .from('lead_views')
      .select('viewer_id');

    if (leadViews) {
      report.orphaned_lead_views = leadViews.filter(
        v => !authUserIds.has(v.viewer_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_lead_views} verwaiste Lead-Ansichten gefunden`);

    // 9. Check for orphaned lead_purchases
    const { data: purchases } = await supabase
      .from('lead_purchases')
      .select('buyer_id');

    if (purchases) {
      report.orphaned_lead_purchases = purchases.filter(
        p => !authUserIds.has(p.buyer_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_lead_purchases} verwaiste Lead-Käufe gefunden`);

    // 10. Check for orphaned leads
    const { data: leads } = await supabase
      .from('leads')
      .select('owner_id');

    if (leads) {
      report.orphaned_leads = leads.filter(
        l => !authUserIds.has(l.owner_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_leads} verwaiste Aufträge gefunden`);

    // 11. Check for orphaned magic_tokens
    const { data: tokens } = await supabase
      .from('magic_tokens')
      .select('user_id')
      .not('user_id', 'is', null);

    if (tokens) {
      report.orphaned_magic_tokens = tokens.filter(
        t => t.user_id && !authUserIds.has(t.user_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_magic_tokens} verwaiste Magic-Tokens gefunden`);

    // 12. Check for orphaned payment_history
    const { data: payments } = await supabase
      .from('payment_history')
      .select('user_id');

    if (payments) {
      report.orphaned_payment_history = payments.filter(
        p => !authUserIds.has(p.user_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_payment_history} verwaiste Zahlungen gefunden`);

    // 13. Check for orphaned handwerker_documents
    const { data: docs } = await supabase
      .from('handwerker_documents')
      .select('user_id');

    if (docs) {
      report.orphaned_handwerker_documents = docs.filter(
        d => !authUserIds.has(d.user_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_handwerker_documents} verwaiste Dokumente gefunden`);

    // 14. Check for orphaned messages
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id, recipient_id');

    if (messages) {
      report.orphaned_messages = messages.filter(
        m => !authUserIds.has(m.sender_id) || !authUserIds.has(m.recipient_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_messages} verwaiste Nachrichten gefunden`);

    // 15. Check for orphaned conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('homeowner_id, handwerker_id');

    if (conversations) {
      report.orphaned_conversations = conversations.filter(
        c => !authUserIds.has(c.homeowner_id) || !authUserIds.has(c.handwerker_id)
      ).length;
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_conversations} verwaiste Konversationen gefunden`);

    // Calculate total
    report.total_orphans =
      report.orphaned_profiles.length +
      report.orphaned_user_roles.length +
      report.orphaned_handwerker_profiles.length +
      report.orphaned_subscriptions.length +
      report.orphaned_client_notifications +
      report.orphaned_handwerker_notifications +
      report.orphaned_reviews +
      report.orphaned_lead_proposals +
      report.orphaned_lead_views +
      report.orphaned_lead_purchases +
      report.orphaned_leads +
      report.orphaned_magic_tokens +
      report.orphaned_payment_history +
      report.orphaned_handwerker_documents +
      report.orphaned_messages +
      report.orphaned_conversations;

    console.log(`[ORPHAN-CHECK] Total verwaiste Datensätze: ${report.total_orphans}`);

    // Create admin notification if orphans found
    if (report.total_orphans > 0) {
      const summary = [
        report.orphaned_profiles.length > 0 ? `${report.orphaned_profiles.length} Profile` : '',
        report.orphaned_user_roles.length > 0 ? `${report.orphaned_user_roles.length} Benutzerrollen` : '',
        report.orphaned_handwerker_profiles.length > 0 ? `${report.orphaned_handwerker_profiles.length} Handwerker-Profile` : '',
        report.orphaned_subscriptions.length > 0 ? `${report.orphaned_subscriptions.length} Abonnements` : '',
        report.orphaned_client_notifications > 0 ? `${report.orphaned_client_notifications} Kunden-Benachrichtigungen` : '',
        report.orphaned_handwerker_notifications > 0 ? `${report.orphaned_handwerker_notifications} Handwerker-Benachrichtigungen` : '',
        report.orphaned_reviews > 0 ? `${report.orphaned_reviews} Bewertungen` : '',
        report.orphaned_lead_proposals > 0 ? `${report.orphaned_lead_proposals} Offerten` : '',
        report.orphaned_lead_views > 0 ? `${report.orphaned_lead_views} Lead-Ansichten` : '',
        report.orphaned_lead_purchases > 0 ? `${report.orphaned_lead_purchases} Lead-Käufe` : '',
        report.orphaned_leads > 0 ? `${report.orphaned_leads} Aufträge` : '',
        report.orphaned_magic_tokens > 0 ? `${report.orphaned_magic_tokens} Magic-Tokens` : '',
        report.orphaned_payment_history > 0 ? `${report.orphaned_payment_history} Zahlungen` : '',
        report.orphaned_handwerker_documents > 0 ? `${report.orphaned_handwerker_documents} Dokumente` : '',
        report.orphaned_messages > 0 ? `${report.orphaned_messages} Nachrichten` : '',
        report.orphaned_conversations > 0 ? `${report.orphaned_conversations} Konversationen` : '',
      ].filter(Boolean).join(', ');

      await supabase.from('admin_notifications').insert({
        type: 'orphaned_records',
        title: 'Verwaiste Datensätze gefunden',
        message: `${report.total_orphans} verwaiste Datensätze gefunden: ${summary}. Bitte prüfen und bereinigen.`,
        metadata: {
          report,
          orphaned_emails: report.orphaned_profiles.map(p => p.email),
        },
      });

      console.log('[ORPHAN-CHECK] Admin-Benachrichtigung erstellt');
    }

    return successResponse({
      success: true,
      message: report.total_orphans === 0 
        ? 'Keine verwaisten Datensätze gefunden'
        : `${report.total_orphans} verwaiste Datensätze gefunden`,
      report,
    });

  } catch (error) {
    console.error('[ORPHAN-CHECK] Fehler:', error);
    
    // Try to create admin notification for scan failure
    try {
      const supabase = createSupabaseAdmin();
      await supabase.from('admin_notifications').insert({
        type: 'orphan_scan_failed',
        title: 'Verwaiste-Datensätze-Scan fehlgeschlagen',
        message: `Fehler beim Scannen nach verwaisten Datensätzen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      });
    } catch (notifError) {
      console.error('[ORPHAN-CHECK] Fehler beim Erstellen der Admin-Benachrichtigung:', notifError);
    }
    
    return errorResponse(
      error instanceof Error ? error.message : 'Unbekannter Fehler',
      500
    );
  }
});
