import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from "../_shared/cors.ts";

/**
 * Lead Expiry Check Edge Function
 * 
 * This function checks for active leads that have passed their proposal_deadline
 * and transitions them to 'expired' status.
 * 
 * Should be called daily via pg_cron at 00:05 Swiss time (23:05 UTC in winter, 22:05 UTC in summer)
 */

interface ExpiredLead {
  id: string;
  title: string;
  owner_id: string;
  proposal_deadline: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Running lead expiry check...");

    // Find all active leads with passed proposal_deadline
    const { data: expiredLeads, error: fetchError } = await supabase
      .from("leads")
      .select("id, title, owner_id, proposal_deadline")
      .eq("status", "active")
      .not("proposal_deadline", "is", null)
      .lt("proposal_deadline", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired leads:", fetchError);
      throw fetchError;
    }

    if (!expiredLeads || expiredLeads.length === 0) {
      console.log("No expired leads found.");
      return successResponse({ 
        message: "No expired leads found", 
        processed: 0 
      });
    }

    console.log(`Found ${expiredLeads.length} expired leads to process`);

    // Update status for all expired leads
    const { error: updateError } = await supabase
      .from("leads")
      .update({ 
        status: "expired", 
        updated_at: new Date().toISOString() 
      })
      .in("id", expiredLeads.map((l: ExpiredLead) => l.id));

    if (updateError) {
      console.error("Error updating expired leads:", updateError);
      throw updateError;
    }

    // Create notifications for lead owners
    const notifications = expiredLeads.map((lead: ExpiredLead) => ({
      user_id: lead.owner_id,
      type: "lead_expired",
      title: "Auftrag abgelaufen",
      message: `Die Angebotsfrist für "${lead.title}" ist abgelaufen.`,
      related_id: lead.id,
      metadata: { lead_title: lead.title },
    }));

    if (notifications.length > 0) {
      const { error: notifyError } = await supabase
        .from("client_notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("Error creating expiry notifications:", notifyError);
        // Don't throw - notifications are not critical
      }
    }

    // Also notify handwerkers who had pending proposals on these leads
    for (const lead of expiredLeads) {
      const { data: pendingProposals, error: proposalError } = await supabase
        .from("lead_proposals")
        .select("handwerker_id")
        .eq("lead_id", lead.id)
        .eq("status", "pending");

      if (proposalError) {
        console.error(`Error fetching proposals for lead ${lead.id}:`, proposalError);
        continue;
      }

      if (pendingProposals && pendingProposals.length > 0) {
        const handwerkerNotifications = pendingProposals.map((p) => ({
          user_id: p.handwerker_id,
          type: "lead_expired",
          title: "Auftrag abgelaufen",
          message: `Die Angebotsfrist für "${lead.title}" ist abgelaufen. Ihr Angebot wurde nicht mehr berücksichtigt.`,
          related_id: lead.id,
          metadata: { lead_title: lead.title },
        }));

        const { error: handwerkerNotifyError } = await supabase
          .from("handwerker_notifications")
          .insert(handwerkerNotifications);

        if (handwerkerNotifyError) {
          console.error("Error creating handwerker expiry notifications:", handwerkerNotifyError);
        }

        // Update pending proposals to withdrawn/expired
        await supabase
          .from("lead_proposals")
          .update({ status: "withdrawn", updated_at: new Date().toISOString() })
          .eq("lead_id", lead.id)
          .eq("status", "pending");
      }
    }

    console.log(`Successfully processed ${expiredLeads.length} expired leads`);

    return successResponse({
      message: `Processed ${expiredLeads.length} expired leads`,
      processed: expiredLeads.length,
      leads: expiredLeads.map((l: ExpiredLead) => l.id),
    });

  } catch (error: any) {
    console.error("Lead expiry check error:", error);
    return errorResponse(error.message || "Unknown error occurred", 500);
  }
});
