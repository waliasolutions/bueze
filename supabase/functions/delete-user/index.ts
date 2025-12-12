import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isAdmin = callerRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Deleting user ${userId} by admin ${caller.email}`);

    const deletionStats: Record<string, number> = {};

    // Delete in order respecting foreign key constraints
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

    // 8. Handwerker subscriptions
    const { data: subs } = await supabase
      .from('handwerker_subscriptions')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_subscriptions = subs?.length || 0;

    // 9. Handwerker profiles
    const { data: hwProfiles } = await supabase
      .from('handwerker_profiles')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_profiles = hwProfiles?.length || 0;

    // 10. Client notifications
    const { data: clientNotifs } = await supabase
      .from('client_notifications')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.client_notifications = clientNotifs?.length || 0;

    // 11. Handwerker notifications
    const { data: hwNotifs } = await supabase
      .from('handwerker_notifications')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.handwerker_notifications = hwNotifs?.length || 0;

    // 12. Payment history
    const { data: payments } = await supabase
      .from('payment_history')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.payment_history = payments?.length || 0;

    // 13. User roles
    const { data: roles } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .select('id');
    deletionStats.user_roles = roles?.length || 0;

    // 14. Profile
    const { data: profiles } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select('id');
    deletionStats.profiles = profiles?.length || 0;

    // 15. Delete auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Continue anyway - data is already deleted
    } else {
      deletionStats.auth_user = 1;
    }

    console.log(`User ${userId} deleted. Stats:`, deletionStats);

    return new Response(JSON.stringify({ 
      success: true, 
      deletionStats,
      message: 'User and all related data permanently deleted'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
