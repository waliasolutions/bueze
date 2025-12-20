import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

interface DeletionResult {
  success: boolean;
  deletionType: 'full' | 'guest' | 'partial';
  deletionStats: Record<string, number>;
  verified: boolean;
  orphanedRecords: Record<string, number>;
  message: string;
  warnings: string[];
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseAdmin();
  let deletedEmail = '';
  let deletedUserId: string | null = null;
  let deletedBy: string | null = null;
  let deletionType: 'full' | 'guest' | 'partial' = 'full';
  let deletionStats: Record<string, number> = {};
  let success = true;
  let errorMessage: string | null = null;

  try {
    // Get authorization header to verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    // Verify caller is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return errorResponse('Invalid token', 401);
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isAdmin = callerRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return errorResponse('Admin access required', 403);
    }

    deletedBy = caller.id;
    const { userId, email } = await req.json();
    
    // ============================================
    // GUEST REGISTRATION DELETION (by email only)
    // ============================================
    if (!userId && email) {
      console.log(`[DELETE-USER] Deleting guest registration by email: ${email}`);
      deletedEmail = email;
      deletionType = 'guest';
      
      // Get guest profiles by email (no user_id)
      const { data: guestProfiles } = await supabase
        .from('handwerker_profiles')
        .select('id')
        .eq('email', email)
        .is('user_id', null);
      
      if (guestProfiles && guestProfiles.length > 0) {
        const profileIds = guestProfiles.map(p => p.id);
        
        // Delete documents
        const { data: docs } = await supabase
          .from('handwerker_documents')
          .delete()
          .in('handwerker_profile_id', profileIds)
          .select('id');
        deletionStats.handwerker_documents = docs?.length || 0;
        
        // Delete approval history
        const { data: history } = await supabase
          .from('handwerker_approval_history')
          .delete()
          .in('handwerker_profile_id', profileIds)
          .select('id');
        deletionStats.handwerker_approval_history = history?.length || 0;
        
        // Delete the profiles
        const { data: profiles } = await supabase
          .from('handwerker_profiles')
          .delete()
          .eq('email', email)
          .is('user_id', null)
          .select('id');
        deletionStats.handwerker_profiles = profiles?.length || 0;
      }
      
      // Verify guest is fully deleted
      const orphanedRecords = await verifyEmailFreed(supabase, email, null);
      const verified = Object.values(orphanedRecords).every(v => v === 0);
      
      // Log to audit table
      await logDeletionAudit(supabase, {
        deletedUserId: null,
        deletedEmail: email,
        deletedBy,
        deletionType: 'guest',
        deletionStats,
        success: true,
        errorMessage: null,
        verified,
        orphanedRecords,
      });
      
      console.log(`[DELETE-USER] Guest registration deleted for ${email}. Stats:`, deletionStats);
      
      const result: DeletionResult = { 
        success: true, 
        deletionType: 'guest',
        deletionStats,
        verified,
        orphanedRecords,
        message: verified 
          ? 'Guest registration fully deleted and verified clean'
          : 'Guest registration deleted but some orphaned records remain',
        warnings: verified ? [] : ['Orphaned records detected - manual cleanup may be needed'],
      };
      
      return successResponse(result);
    }
    
    // ============================================
    // FULL USER DELETION (by userId)
    // ============================================
    if (!userId) {
      return errorResponse('userId or email is required', 400);
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return errorResponse('Cannot delete your own account', 400);
    }

    deletedUserId = userId;
    console.log(`[DELETE-USER] Deleting user ${userId} by admin ${caller.email}`);

    // Get user email before deletion for verification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    
    deletedEmail = userProfile?.email || '';

    // Get handwerker profile ID for this user (if any)
    const { data: handwerkerProfile } = await supabase
      .from('handwerker_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // ============================================
    // CRITICAL: Delete auth user FIRST
    // If this fails, we abort to prevent orphaned data
    // ============================================
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('[DELETE-USER] CRITICAL: Failed to delete auth user:', deleteAuthError);
      
      // Log failed attempt
      await logDeletionAudit(supabase, {
        deletedUserId: userId,
        deletedEmail,
        deletedBy,
        deletionType: 'full',
        deletionStats: {},
        success: false,
        errorMessage: `Auth user deletion failed: ${deleteAuthError.message}`,
        verified: false,
        orphanedRecords: {},
      });
      
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}. No data was deleted to prevent orphaned records.`);
    }
    deletionStats.auth_user = 1;
    console.log(`[DELETE-USER] Auth user ${userId} deleted successfully`);

    // ============================================
    // Clean up all related data (auth user triggers may have handled some)
    // ============================================
    
    // 1. Messages
    const { data: msgs } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .select('id');
    deletionStats.messages = msgs?.length || 0;

    // 2. Conversations
    const { data: convs } = await supabase
      .from('conversations')
      .delete()
      .or(`homeowner_id.eq.${userId},handwerker_id.eq.${userId}`)
      .select('id');
    deletionStats.conversations = convs?.length || 0;

    // 3. Reviews (as reviewer or reviewed)
    const { data: revs } = await supabase
      .from('reviews')
      .delete()
      .or(`reviewer_id.eq.${userId},reviewed_id.eq.${userId}`)
      .select('id');
    deletionStats.reviews = revs?.length || 0;

    // 4. Lead views
    const { data: views } = await supabase
      .from('lead_views')
      .delete()
      .eq('viewer_id', userId)
      .select('id');
    deletionStats.lead_views = views?.length || 0;

    // 5. Lead proposals
    const { data: props } = await supabase
      .from('lead_proposals')
      .delete()
      .eq('handwerker_id', userId)
      .select('id');
    deletionStats.lead_proposals = props?.length || 0;

    // 6. Lead purchases
    const { data: purchases } = await supabase
      .from('lead_purchases')
      .delete()
      .eq('buyer_id', userId)
      .select('id');
    deletionStats.lead_purchases = purchases?.length || 0;

    // 7. Leads owned by user
    const { data: leads } = await supabase
      .from('leads')
      .delete()
      .eq('owner_id', userId)
      .select('id');
    deletionStats.leads = leads?.length || 0;

    // 8. Magic tokens
    const { data: tokens } = await supabase
      .from('magic_tokens')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.magic_tokens = tokens?.length || 0;

    // 9. Handwerker documents (both by profile_id and user_id)
    if (handwerkerProfile) {
      const { data: docs } = await supabase
        .from('handwerker_documents')
        .delete()
        .eq('handwerker_profile_id', handwerkerProfile.id)
        .select('id');
      deletionStats.handwerker_documents = docs?.length || 0;
      
      // Delete approval history
      const { data: approvalHistory } = await supabase
        .from('handwerker_approval_history')
        .delete()
        .eq('handwerker_profile_id', handwerkerProfile.id)
        .select('id');
      deletionStats.handwerker_approval_history = approvalHistory?.length || 0;
    }
    
    // Also delete documents by user_id (in case profile was already deleted)
    const { data: userDocs } = await supabase
      .from('handwerker_documents')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_documents = (deletionStats.handwerker_documents || 0) + (userDocs?.length || 0);

    // 10. Handwerker subscriptions
    const { data: subs } = await supabase
      .from('handwerker_subscriptions')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_subscriptions = subs?.length || 0;

    // 11. Handwerker profiles
    const { data: hwProfiles } = await supabase
      .from('handwerker_profiles')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_profiles = hwProfiles?.length || 0;

    // 12. Client notifications
    const { data: clientNotifs } = await supabase
      .from('client_notifications')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.client_notifications = clientNotifs?.length || 0;

    // 13. Handwerker notifications
    const { data: hwNotifs } = await supabase
      .from('handwerker_notifications')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_notifications = hwNotifs?.length || 0;

    // 14. Payment history
    const { data: payments } = await supabase
      .from('payment_history')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.payment_history = payments?.length || 0;

    // 15. User roles (should be cascade deleted, but ensure cleanup)
    const { data: roles } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.user_roles = roles?.length || 0;

    // 16. Profile (should be cascade deleted, but ensure cleanup)
    const { data: profiles } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select('id');
    deletionStats.profiles = profiles?.length || 0;

    // ============================================
    // VERIFICATION: Check if email is truly freed
    // ============================================
    const orphanedRecords = await verifyEmailFreed(supabase, deletedEmail, userId);
    const verified = Object.values(orphanedRecords).every(v => v === 0);
    
    if (!verified) {
      console.warn(`[DELETE-USER] WARNING: Orphaned records detected after deletion:`, orphanedRecords);
      deletionType = 'partial';
    }

    // Log to audit table
    await logDeletionAudit(supabase, {
      deletedUserId: userId,
      deletedEmail,
      deletedBy,
      deletionType,
      deletionStats,
      success: true,
      errorMessage: null,
      verified,
      orphanedRecords,
    });

    console.log(`[DELETE-USER] User ${userId} fully deleted. Verified: ${verified}. Stats:`, deletionStats);

    const warnings: string[] = [];
    if (!verified) {
      warnings.push('Some orphaned records were detected after deletion');
      Object.entries(orphanedRecords).forEach(([table, count]) => {
        if (count > 0) {
          warnings.push(`${count} orphaned record(s) in ${table}`);
        }
      });
    }

    const result: DeletionResult = { 
      success: true,
      deletionType,
      deletionStats,
      verified,
      orphanedRecords,
      message: verified 
        ? 'User and all related data permanently deleted and verified clean'
        : 'User deleted but some orphaned records may remain',
      warnings,
    };

    return successResponse(result);

  } catch (error) {
    console.error('[DELETE-USER] Error:', error);
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to log failed attempt (may fail if supabase is unavailable)
    try {
      await logDeletionAudit(supabase, {
        deletedUserId,
        deletedEmail,
        deletedBy,
        deletionType: 'partial',
        deletionStats,
        success: false,
        errorMessage,
        verified: false,
        orphanedRecords: {},
      });
    } catch (logError) {
      console.error('[DELETE-USER] Failed to log audit:', logError);
    }
    
    return errorResponse(errorMessage, 500);
  }
});

/**
 * Verify that an email is truly freed after deletion
 * Checks all tables that might still reference the user
 */
async function verifyEmailFreed(
  supabase: any,
  email: string,
  userId: string | null
): Promise<Record<string, number>> {
  const orphanedRecords: Record<string, number> = {};

  // Check profiles table
  if (email) {
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);
    orphanedRecords.profiles = profileCount || 0;
  }

  // Check handwerker_profiles
  if (email) {
    const { count: hwProfileCount } = await supabase
      .from('handwerker_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);
    orphanedRecords.handwerker_profiles = hwProfileCount || 0;
  }

  // Check user_roles by user_id
  if (userId) {
    const { count: rolesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    orphanedRecords.user_roles = rolesCount || 0;
  }

  // Check handwerker_subscriptions
  if (userId) {
    const { count: subsCount } = await supabase
      .from('handwerker_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    orphanedRecords.handwerker_subscriptions = subsCount || 0;
  }

  // Check notifications
  if (userId) {
    const { count: clientNotifCount } = await supabase
      .from('client_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    orphanedRecords.client_notifications = clientNotifCount || 0;

    const { count: hwNotifCount } = await supabase
      .from('handwerker_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    orphanedRecords.handwerker_notifications = hwNotifCount || 0;
  }

  return orphanedRecords;
}

/**
 * Log deletion attempt to audit table
 */
async function logDeletionAudit(
  supabase: any,
  data: {
    deletedUserId: string | null;
    deletedEmail: string;
    deletedBy: string | null;
    deletionType: 'full' | 'guest' | 'partial';
    deletionStats: Record<string, number>;
    success: boolean;
    errorMessage: string | null;
    verified: boolean;
    orphanedRecords: Record<string, number>;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from('deletion_audit').insert({
      deleted_user_id: data.deletedUserId,
      deleted_email: data.deletedEmail,
      deleted_by: data.deletedBy,
      deletion_type: data.deletionType,
      deletion_stats: data.deletionStats,
      success: data.success,
      error_message: data.errorMessage,
      verified_clean: data.verified,
      orphaned_records: data.orphanedRecords,
    });

    if (error) {
      console.error('[DELETE-USER] Failed to log audit:', error);
    } else {
      console.log('[DELETE-USER] Audit logged successfully');
    }
  } catch (err) {
    console.error('[DELETE-USER] Exception logging audit:', err);
  }
}
