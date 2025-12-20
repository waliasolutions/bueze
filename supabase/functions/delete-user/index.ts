import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

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

    const { userId, email } = await req.json();
    
    // Support email-based deletion for guest registrations
    if (!userId && email) {
      console.log(`Deleting guest registration by email: ${email}`);
      
      const guestDeletionStats: Record<string, number> = {};
      
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
        guestDeletionStats.handwerker_documents = docs?.length || 0;
        
        // Delete approval history
        const { data: history } = await supabase
          .from('handwerker_approval_history')
          .delete()
          .in('handwerker_profile_id', profileIds)
          .select('id');
        guestDeletionStats.handwerker_approval_history = history?.length || 0;
        
        // Delete the profiles
        const { data: profiles } = await supabase
          .from('handwerker_profiles')
          .delete()
          .eq('email', email)
          .is('user_id', null)
          .select('id');
        guestDeletionStats.handwerker_profiles = profiles?.length || 0;
      }
      
      console.log(`Guest registration deleted for ${email}. Stats:`, guestDeletionStats);
      
      return successResponse({ 
        success: true, 
        deletionStats: guestDeletionStats,
        message: 'Guest registration deleted'
      });
    }
    
    if (!userId) {
      return errorResponse('userId or email is required', 400);
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return errorResponse('Cannot delete your own account', 400);
    }

    console.log(`Deleting user ${userId} by admin ${caller.email}`);

    const deletionStats: Record<string, number> = {};

    // Get handwerker profile ID for this user (if any)
    const { data: handwerkerProfile } = await supabase
      .from('handwerker_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // IMPORTANT: Delete auth user FIRST to prevent orphaned records
    // If this fails, we don't proceed with data deletion to maintain consistency
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}. No data was deleted.`);
    }
    deletionStats.auth_user = 1;
    console.log(`Auth user ${userId} deleted successfully`);

    // Now clean up any remaining data (in case triggers didn't fire or data was orphaned)
    
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

    console.log(`User ${userId} fully deleted. Stats:`, deletionStats);

    return successResponse({ 
      success: true, 
      deletionStats,
      message: 'User and all related data permanently deleted'
    });

  } catch (error) {
    console.error('Error in delete-user:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
