// supabase/functions/create-checkout.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({
        error: "Stripe key not configured"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });
    const { planName = "Basic", customerEmail } = await req.json();
    const priceMap = {
      Basic: "price_1ReO4rEuB2J4BS43srM8QwHw",
      Premium: "price_1ReO5dEuB2J4BS43BF3XvNDA"
    };
    const priceId = priceMap[planName];
    if (!priceId) {
      return new Response(JSON.stringify({
        error: "Invalid plan selected"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      billing_address_collection: "required",
      success_url: `${origin}/company/registration?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription-plan?payment=cancelled`,
      metadata: {
        plan_name: planName,
        source: "stackbuild_app",
        flow: "pre_registration"
      },
      ...customerEmail && {
        customer_email: customerEmail
      }
    });
    return new Response(JSON.stringify({
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("[CHECKOUT] ERROR", err);
    return new Response(JSON.stringify({
      error: "Internal error"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
