
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

  try {
    logStep("Function started");

    // Check for Stripe secret key first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep("Checking Stripe secret key", { hasKey: !!stripeKey, keyLength: stripeKey?.length });
    
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // First, let's verify the price exists
    let priceId = "price_1RbVmQEuB2J4BS43bsSzcSQM";
    try {
      const price = await stripe.prices.retrieve(priceId);
      logStep("Price verified", { priceId, amount: price.unit_amount, currency: price.currency });
    } catch (priceError) {
      logStep("Price verification failed, attempting to create a fallback price", { originalPriceId: priceId, error: priceError.message });
      
      // Create a product first
      const product = await stripe.products.create({
        name: "StackBuild Plan",
        description: "Payroll & Management for Construction Companies"
      });
      
      // Create a price for the product
      const fallbackPrice = await stripe.prices.create({
        unit_amount: 19700, // $197.00 CAD
        currency: "cad",
        recurring: { interval: "month" },
        product: product.id,
      });
      
      priceId = fallbackPrice.id;
      logStep("Created fallback price", { newPriceId: priceId, amount: fallbackPrice.unit_amount });
    }

    const { planName = "StackBuild Plan", customerEmail } = await req.json();
    logStep("Request data", { priceId, planName, customerEmail });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session for guest checkout (pre-registration)
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/register-company?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_creation: "always", // Always create a customer
      metadata: {
        plan_name: planName,
        source: "stackbuild_app",
        flow: "pre_registration"
      },
      // Collect customer email during checkout
      billing_address_collection: "required",
    };

    // Only add customer_email if provided
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    logStep("Creating checkout session", sessionConfig);
    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ 
      error: "Failed to create checkout session. Please try again." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
