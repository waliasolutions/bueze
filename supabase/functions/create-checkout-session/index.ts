import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  planType: 'monthly' | '6_month' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

// Price configurations in CHF cents
const PLAN_PRICES = {
  monthly: {
    amount: 9000, // CHF 90
    interval: 'month' as const,
    intervalCount: 1,
    name: 'Monatlich',
  },
  '6_month': {
    amount: 51000, // CHF 510
    interval: 'month' as const,
    intervalCount: 6,
    name: '6 Monate',
  },
  annual: {
    amount: 96000, // CHF 960
    interval: 'year' as const,
    intervalCount: 1,
    name: 'Jährlich',
  },
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
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

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { planType, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    if (!planType || !PLAN_PRICES[planType]) {
      throw new Error("Invalid plan type");
    }

    const planConfig = PLAN_PRICES[planType];

    console.log(`Creating checkout session for user ${user.id}, plan: ${planType}`);

    // Check if customer already exists in Stripe
    let customerId: string | undefined;
    const { data: existingSub } = await supabase
      .from('handwerker_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
      console.log(`Found existing Stripe customer: ${customerId}`);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log(`Created new Stripe customer: ${customerId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Büeze.ch ${planConfig.name} Abo`,
              description: 'Unbegrenzte Offerten für Handwerker',
            },
            unit_amount: planConfig.amount,
            recurring: {
              interval: planConfig.interval,
              interval_count: planConfig.intervalCount,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://bueeze.ch/profile?tab=subscription&success=true',
      cancel_url: cancelUrl || 'https://bueeze.ch/checkout',
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
      },
      locale: 'de',
      allow_promotion_codes: true,
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
