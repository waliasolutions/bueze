import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll process without signature verification (add STRIPE_WEBHOOK_SECRET later)
    const event = JSON.parse(body) as Stripe.Event;

    console.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);

        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (!userId || !planType) {
          console.error("Missing user_id or plan_type in session metadata");
          break;
        }

        // Calculate period dates
        const now = new Date();
        let periodEnd: Date;
        let proposalsLimit = -1; // Unlimited for paid plans

        if (planType === 'monthly') {
          periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else if (planType === '6_month') {
          periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 6);
        } else {
          periodEnd = new Date(now);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update or create subscription
        const { error: subError } = await supabase
          .from('handwerker_subscriptions')
          .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            proposals_limit: proposalsLimit,
            proposals_used_this_period: 0,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }, {
            onConflict: 'user_id'
          });

        if (subError) {
          console.error("Error updating subscription:", subError);
        } else {
          console.log(`Subscription activated for user ${userId}, plan: ${planType}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id}`);

        const userId = subscription.metadata?.user_id;
        if (!userId) {
          console.error("Missing user_id in subscription metadata");
          break;
        }

        const status = subscription.status === 'active' ? 'active' : 
                       subscription.status === 'canceled' ? 'canceled' : 
                       subscription.status;

        const { error } = await supabase
          .from('handwerker_subscriptions')
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);

        // Downgrade to free tier
        const { error } = await supabase
          .from('handwerker_subscriptions')
          .update({
            plan_type: 'free',
            status: 'active',
            proposals_limit: 5,
            proposals_used_this_period: 0,
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error("Error downgrading subscription:", error);
        } else {
          console.log(`Subscription downgraded to free tier`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice paid: ${invoice.id}`);

        if (invoice.subscription) {
          // Reset proposal count on successful payment (new billing period)
          const { error } = await supabase
            .from('handwerker_subscriptions')
            .update({
              proposals_used_this_period: 0,
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (error) {
            console.error("Error resetting proposal count:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
