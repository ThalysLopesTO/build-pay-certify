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
    const { customerEmail } = await req.json();
    
    // Single plan: StackBuild Pro - $297/month with 7-day trial
    const priceId = "price_1SDwZqEuB2J4BS43UulwfZ68";
    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        },
        metadata: {
          trial_enabled: 'true',
          plan_name: 'StackBuild Pro',
          source: 'stackbuild_app',
          flow: 'pre_registration'
        }
      },
      billing_address_collection: "required",
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${origin}/company/registration?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription-plan?payment=cancelled`,
      metadata: {
        plan_name: 'StackBuild Pro',
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
