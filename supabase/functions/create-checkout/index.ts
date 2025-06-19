
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Check for Stripe secret key first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Stripe secret key not configured");
      return new Response(JSON.stringify({ 
        error: "Payment processing is not configured. Please contact support." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Stripe key verified");

    // Check for authentication (optional for subscription flow)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = null;
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      
      if (data.user?.email) {
        user = data.user;
        userEmail = data.user.email;
        userId = data.user.id;
        logStep("User authenticated", { userId, email: userEmail });
      }
    }

    // If no authenticated user, this will be a guest checkout
    if (!user) {
      logStep("Guest checkout - no authentication provided");
    }

    const { priceId, planName = "StackBuild Plan" } = await req.json();
    if (!priceId) {
      logStep("ERROR: Price ID missing from request");
      return new Response(JSON.stringify({ 
        error: "Price ID is required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    let customerId = null;
    
    // Only check for existing customer if we have an authenticated user
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { 
            user_id: userId || "",
            plan_name: planName,
            source: "stackbuild_app"
          }
        });
        customerId = customer.id;
        logStep("Created new customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/register-company?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
      metadata: {
        plan_name: planName,
        source: "stackbuild_app"
      }
    };

    // Add customer info if available
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      // For guest checkout, let Stripe collect email
      sessionConfig.customer_creation = "always";
    }

    // Add user_id to metadata if available
    if (userId) {
      sessionConfig.metadata.user_id = userId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: "Failed to create checkout session. Please try again." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
