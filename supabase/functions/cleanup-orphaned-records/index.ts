import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

/**
 * Admin function to cleanup orphaned records
 * This performs actual deletion of orphaned records found by find-orphaned-records
 * 
 * CAUTION: This is a destructive operation and should only be run by admins
 * after reviewing the orphaned records report
 */

interface CleanupReport {
  deleted_profiles: number;
  deleted_user_roles: number;
  deleted_handwerker_profiles: number;
  deleted_subscriptions: number;
  deleted_client_notifications: number;
  deleted_handwerker_notifications: number;
  deleted_reviews: number;
  deleted_lead_proposals: number;
  deleted_lead_views: number;
  deleted_lead_purchases: number;
  deleted_leads: number;
  deleted_magic_tokens: number;
  deleted_payment_history: number;
  deleted_handwerker_documents: number;
  deleted_messages: number;
  deleted_conversations: number;
  total_deleted: number;
  cleanup_timestamp: string;
  errors: string[];
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Nicht autorisiert', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return errorResponse('Ungültiges Token', 401);
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isAdmin = callerRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return errorResponse('Admin-Zugang erforderlich', 403);
    }

    console.log('[CLEANUP-ORPHANS] Admin', caller.email, 'hat Bereinigung gestartet');

    const report: CleanupReport = {
      deleted_profiles: 0,
      deleted_user_roles: 0,
      deleted_handwerker_profiles: 0,
      deleted_subscriptions: 0,
      deleted_client_notifications: 0,
      deleted_handwerker_notifications: 0,
      deleted_reviews: 0,
      deleted_lead_proposals: 0,
      deleted_lead_views: 0,
      deleted_lead_purchases: 0,
      deleted_leads: 0,
      deleted_magic_tokens: 0,
      deleted_payment_history: 0,
      deleted_handwerker_documents: 0,
      deleted_messages: 0,
      deleted_conversations: 0,
      total_deleted: 0,
      cleanup_timestamp: new Date().toISOString(),
      errors: [],
    };

    // Get all auth user IDs
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    if (authUsersError) {
      throw new Error(`Fehler beim Abrufen der Auth-Benutzer: ${authUsersError.message}`);
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    console.log(`[CLEANUP-ORPHANS] ${authUserIds.size} Auth-Benutzer gefunden`);

    // Helper to delete orphaned records from a table
    const deleteOrphans = async (
      tableName: string,
      userIdColumn: string,
      condition?: { column: string; value: any }
    ): Promise<number> => {
      try {
        // First get all records
        let query = supabase.from(tableName).select(userIdColumn);
        if (condition) {
          query = query.not(condition.column, 'is', condition.value);
        }
        const { data: records } = await query;

        if (!records || records.length === 0) return 0;

        // Find orphaned IDs
        const typedRecords = records as Record<string, any>[];
        const orphanedIds = typedRecords
          .filter(r => r[userIdColumn] && !authUserIds.has(r[userIdColumn]))
          .map(r => r[userIdColumn]);

        if (orphanedIds.length === 0) return 0;

        // Delete them
        const { data: deleted, error } = await supabase
          .from(tableName)
          .delete()
          .in(userIdColumn, orphanedIds)
          .select('id');

        if (error) {
          report.errors.push(`Fehler bei ${tableName}: ${error.message}`);
          return 0;
        }

        return deleted?.length || 0;
      } catch (err) {
        report.errors.push(`Ausnahme bei ${tableName}: ${err instanceof Error ? err.message : 'Unbekannt'}`);
        return 0;
      }
    };

    // Delete orphaned records in correct order (dependencies first)
    
    // 1. Messages (depends on conversations)
    try {
      const { data: messages } = await supabase.from('messages').select('id, sender_id, recipient_id');
      if (messages) {
        const orphanedMsgIds = messages
          .filter(m => !authUserIds.has(m.sender_id) || !authUserIds.has(m.recipient_id))
          .map(m => m.id);
        if (orphanedMsgIds.length > 0) {
          const { data: deleted } = await supabase.from('messages').delete().in('id', orphanedMsgIds).select('id');
          report.deleted_messages = deleted?.length || 0;
        }
      }
    } catch (err) {
      report.errors.push(`Nachrichten: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // 2. Conversations
    try {
      const { data: convs } = await supabase.from('conversations').select('id, homeowner_id, handwerker_id');
      if (convs) {
        const orphanedConvIds = convs
          .filter(c => !authUserIds.has(c.homeowner_id) || !authUserIds.has(c.handwerker_id))
          .map(c => c.id);
        if (orphanedConvIds.length > 0) {
          const { data: deleted } = await supabase.from('conversations').delete().in('id', orphanedConvIds).select('id');
          report.deleted_conversations = deleted?.length || 0;
        }
      }
    } catch (err) {
      report.errors.push(`Konversationen: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // 3. Reviews
    try {
      const { data: reviews } = await supabase.from('reviews').select('id, reviewer_id, reviewed_id');
      if (reviews) {
        const orphanedRevIds = reviews
          .filter(r => !authUserIds.has(r.reviewer_id) || !authUserIds.has(r.reviewed_id))
          .map(r => r.id);
        if (orphanedRevIds.length > 0) {
          const { data: deleted } = await supabase.from('reviews').delete().in('id', orphanedRevIds).select('id');
          report.deleted_reviews = deleted?.length || 0;
        }
      }
    } catch (err) {
      report.errors.push(`Bewertungen: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // 4. Lead views
    report.deleted_lead_views = await deleteOrphans('lead_views', 'viewer_id');

    // 5. Lead proposals
    report.deleted_lead_proposals = await deleteOrphans('lead_proposals', 'handwerker_id');

    // 6. Lead purchases
    report.deleted_lead_purchases = await deleteOrphans('lead_purchases', 'buyer_id');

    // 7. Leads
    report.deleted_leads = await deleteOrphans('leads', 'owner_id');

    // 8. Magic tokens
    report.deleted_magic_tokens = await deleteOrphans('magic_tokens', 'user_id');

    // 9. Payment history
    report.deleted_payment_history = await deleteOrphans('payment_history', 'user_id');

    // 10. Handwerker documents
    report.deleted_handwerker_documents = await deleteOrphans('handwerker_documents', 'user_id');

    // 11. Client notifications
    report.deleted_client_notifications = await deleteOrphans('client_notifications', 'user_id');

    // 12. Handwerker notifications
    report.deleted_handwerker_notifications = await deleteOrphans('handwerker_notifications', 'user_id');

    // 13. Handwerker subscriptions
    report.deleted_subscriptions = await deleteOrphans('handwerker_subscriptions', 'user_id');

    // 14. Handwerker profiles (only with user_id that doesn't exist)
    try {
      const { data: hwProfiles } = await supabase
        .from('handwerker_profiles')
        .select('id, user_id')
        .not('user_id', 'is', null);
      
      if (hwProfiles) {
        const orphanedHwIds = hwProfiles
          .filter(p => p.user_id && !authUserIds.has(p.user_id))
          .map(p => p.id);
        if (orphanedHwIds.length > 0) {
          const { data: deleted } = await supabase.from('handwerker_profiles').delete().in('id', orphanedHwIds).select('id');
          report.deleted_handwerker_profiles = deleted?.length || 0;
        }
      }
    } catch (err) {
      report.errors.push(`Handwerker-Profile: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // 15. User roles
    report.deleted_user_roles = await deleteOrphans('user_roles', 'user_id');

    // 16. Profiles
    try {
      const { data: profiles } = await supabase.from('profiles').select('id');
      if (profiles) {
        const orphanedProfileIds = profiles
          .filter(p => !authUserIds.has(p.id))
          .map(p => p.id);
        if (orphanedProfileIds.length > 0) {
          const { data: deleted } = await supabase.from('profiles').delete().in('id', orphanedProfileIds).select('id');
          report.deleted_profiles = deleted?.length || 0;
        }
      }
    } catch (err) {
      report.errors.push(`Profile: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // Calculate total
    report.total_deleted =
      report.deleted_profiles +
      report.deleted_user_roles +
      report.deleted_handwerker_profiles +
      report.deleted_subscriptions +
      report.deleted_client_notifications +
      report.deleted_handwerker_notifications +
      report.deleted_reviews +
      report.deleted_lead_proposals +
      report.deleted_lead_views +
      report.deleted_lead_purchases +
      report.deleted_leads +
      report.deleted_magic_tokens +
      report.deleted_payment_history +
      report.deleted_handwerker_documents +
      report.deleted_messages +
      report.deleted_conversations;

    console.log(`[CLEANUP-ORPHANS] Bereinigung abgeschlossen. ${report.total_deleted} Datensätze gelöscht.`);

    // Create admin notification with summary
    const summaryParts = [
      report.deleted_profiles > 0 ? `${report.deleted_profiles} Profile` : '',
      report.deleted_user_roles > 0 ? `${report.deleted_user_roles} Benutzerrollen` : '',
      report.deleted_handwerker_profiles > 0 ? `${report.deleted_handwerker_profiles} Handwerker-Profile` : '',
      report.deleted_subscriptions > 0 ? `${report.deleted_subscriptions} Abonnements` : '',
      report.deleted_reviews > 0 ? `${report.deleted_reviews} Bewertungen` : '',
      report.deleted_lead_proposals > 0 ? `${report.deleted_lead_proposals} Offerten` : '',
      report.deleted_leads > 0 ? `${report.deleted_leads} Aufträge` : '',
      report.deleted_messages > 0 ? `${report.deleted_messages} Nachrichten` : '',
      report.deleted_conversations > 0 ? `${report.deleted_conversations} Konversationen` : '',
    ].filter(Boolean).join(', ');

    await supabase.from('admin_notifications').insert({
      type: 'orphan_cleanup_completed',
      title: 'Verwaiste Datensätze bereinigt',
      message: report.total_deleted > 0
        ? `${report.total_deleted} verwaiste Datensätze wurden gelöscht: ${summaryParts}`
        : 'Keine verwaisten Datensätze zum Bereinigen gefunden.',
      metadata: {
        report,
        cleaned_by: caller.email,
      },
    });

    // Log to deletion_audit
    await supabase.from('deletion_audit').insert({
      deleted_email: 'BULK_CLEANUP',
      deleted_by: caller.id,
      deletion_type: 'full',
      deletion_stats: report,
      success: report.errors.length === 0,
      error_message: report.errors.length > 0 ? report.errors.join('; ') : null,
      verified_clean: true,
      orphaned_records: {},
    });

    return successResponse({
      success: true,
      message: report.total_deleted > 0
        ? `${report.total_deleted} verwaiste Datensätze erfolgreich gelöscht`
        : 'Keine verwaisten Datensätze zum Bereinigen gefunden',
      report,
    });

  } catch (error) {
    console.error('[CLEANUP-ORPHANS] Fehler:', error);
    
    // Create admin notification for cleanup failure
    try {
      const supabase = createSupabaseAdmin();
      await supabase.from('admin_notifications').insert({
        type: 'orphan_cleanup_failed',
        title: 'Bereinigung verwaister Datensätze fehlgeschlagen',
        message: `Fehler bei der Bereinigung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      });
    } catch (notifError) {
      console.error('[CLEANUP-ORPHANS] Fehler beim Erstellen der Admin-Benachrichtigung:', notifError);
    }
    
    return errorResponse(
      error instanceof Error ? error.message : 'Unbekannter Fehler',
      500
    );
  }
});
