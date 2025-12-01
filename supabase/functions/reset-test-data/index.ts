import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteStats {
  messages: number;
  conversations: number;
  reviews: number;
  lead_views: number;
  lead_proposals: number;
  lead_purchases: number;
  leads: number;
  handwerker_subscriptions: number;
  handwerker_profiles: number;
  user_roles: number;
  profiles: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (!roleData || roleData.length === 0) {
      throw new Error('User is not an admin');
    }

    console.log('Starting test data cleanup...');
    const stats: DeleteStats = {
      messages: 0,
      conversations: 0,
      reviews: 0,
      lead_views: 0,
      lead_proposals: 0,
      lead_purchases: 0,
      leads: 0,
      handwerker_subscriptions: 0,
      handwerker_profiles: 0,
      user_roles: 0,
      profiles: 0,
    };

    // Identify test users by email patterns
    const { data: testProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .or('email.ilike.%@test.ch,email.ilike.%@handwerk.ch,email.ilike.test@%,email.ilike.%example%,email.ilike.%dummy%');

    const testUserIds = testProfiles?.map(p => p.id) || [];
    console.log(`Found ${testUserIds.length} test users`);

    if (testUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No test data found to delete',
          stats 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete in correct order to respect foreign key constraints

    // 1. Delete messages (references conversations)
    const { data: deletedMessages } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.in.(${testUserIds.join(',')}),recipient_id.in.(${testUserIds.join(',')})`)
      .select('id');
    stats.messages = deletedMessages?.length || 0;
    console.log(`Deleted ${stats.messages} messages`);

    // 2. Delete conversations
    const { data: deletedConversations } = await supabase
      .from('conversations')
      .delete()
      .or(`homeowner_id.in.(${testUserIds.join(',')}),handwerker_id.in.(${testUserIds.join(',')})`)
      .select('id');
    stats.conversations = deletedConversations?.length || 0;
    console.log(`Deleted ${stats.conversations} conversations`);

    // 3. Delete reviews
    const { data: deletedReviews } = await supabase
      .from('reviews')
      .delete()
      .or(`reviewer_id.in.(${testUserIds.join(',')}),reviewed_id.in.(${testUserIds.join(',')})`)
      .select('id');
    stats.reviews = deletedReviews?.length || 0;
    console.log(`Deleted ${stats.reviews} reviews`);

    // 4. Delete lead views
    const { data: deletedViews } = await supabase
      .from('lead_views')
      .delete()
      .in('viewer_id', testUserIds)
      .select('id');
    stats.lead_views = deletedViews?.length || 0;
    console.log(`Deleted ${stats.lead_views} lead views`);

    // 5. Get test leads
    const { data: testLeads } = await supabase
      .from('leads')
      .select('id')
      .in('owner_id', testUserIds);
    const testLeadIds = testLeads?.map(l => l.id) || [];
    console.log(`Found ${testLeadIds.length} test leads`);

    // 6. Delete lead proposals (references leads)
    if (testLeadIds.length > 0) {
      const { data: deletedProposals } = await supabase
        .from('lead_proposals')
        .delete()
        .or(`lead_id.in.(${testLeadIds.join(',')}),handwerker_id.in.(${testUserIds.join(',')})`)
        .select('id');
      stats.lead_proposals = deletedProposals?.length || 0;
      console.log(`Deleted ${stats.lead_proposals} lead proposals`);

      // 7. Delete lead purchases
      const { data: deletedPurchases } = await supabase
        .from('lead_purchases')
        .delete()
        .or(`lead_id.in.(${testLeadIds.join(',')}),buyer_id.in.(${testUserIds.join(',')})`)
        .select('id');
      stats.lead_purchases = deletedPurchases?.length || 0;
      console.log(`Deleted ${stats.lead_purchases} lead purchases`);

      // 8. Delete leads
      const { data: deletedLeads } = await supabase
        .from('leads')
        .delete()
        .in('id', testLeadIds)
        .select('id');
      stats.leads = deletedLeads?.length || 0;
      console.log(`Deleted ${stats.leads} leads`);
    }

    // 9. Delete handwerker subscriptions
    const { data: deletedSubs } = await supabase
      .from('handwerker_subscriptions')
      .delete()
      .in('user_id', testUserIds)
      .select('id');
    stats.handwerker_subscriptions = deletedSubs?.length || 0;
    console.log(`Deleted ${stats.handwerker_subscriptions} subscriptions`);

    // 10. Delete handwerker profiles
    const { data: deletedProfiles } = await supabase
      .from('handwerker_profiles')
      .delete()
      .in('user_id', testUserIds)
      .select('id');
    stats.handwerker_profiles = deletedProfiles?.length || 0;
    console.log(`Deleted ${stats.handwerker_profiles} handwerker profiles`);

    // 11. Delete user roles
    const { data: deletedRoles } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', testUserIds)
      .select('id');
    stats.user_roles = deletedRoles?.length || 0;
    console.log(`Deleted ${stats.user_roles} user roles`);

    // 12. Delete profiles
    const { data: deletedProfilesData } = await supabase
      .from('profiles')
      .delete()
      .in('id', testUserIds)
      .select('id');
    stats.profiles = deletedProfilesData?.length || 0;
    console.log(`Deleted ${stats.profiles} profiles`);

    // 13. Delete auth users (using service role)
    for (const userId of testUserIds) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log(`Deleted auth user: ${userId}`);
      } catch (error) {
        console.error(`Failed to delete auth user ${userId}:`, error);
      }
    }

    console.log('Test data cleanup completed');
    console.log('Stats:', stats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully deleted test data: ${stats.profiles} users, ${stats.leads} leads, ${stats.lead_proposals} proposals`,
        stats 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error resetting test data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
