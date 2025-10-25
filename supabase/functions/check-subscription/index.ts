import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: {
      persistSession: false
    }
  });
  try {
    logStep("Function started");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", {
      userId: user.id,
      email: user.email
    });
    // Get user's company with trial info
    const { data: profile } = await supabaseClient.from('user_profiles').select('company_id, role').eq('user_id', user.id).single();
    
    // Super admins don't need subscription checks
    if (profile?.role === 'super_admin') {
      logStep("Super admin detected - bypassing subscription check");
      return new Response(JSON.stringify({
        subscribed: true,
        plan: 'enterprise',
        subscription_end: null,
        status: 'active',
        is_super_admin: true
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    
    if (!profile?.company_id) {
      throw new Error("User not associated with a company");
    }
    
    // Get company subscription details including trial info
    const { data: company } = await supabaseClient
      .from('companies')
      .select('stripe_customer_id, subscription_status, trial_end_date, grace_period_end_date')
      .eq('id', profile.company_id)
      .single();
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("companies").update({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'free',
        expiration_date: null
      }).eq('id', profile.company_id);
      return new Response(JSON.stringify({
        subscribed: false,
        plan: 'free',
        subscription_end: null
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", {
      customerId
    });
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let plan = 'free';
    let subscriptionEnd = null;
    let subscriptionId = null;
    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      // Determine plan from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      console.log({
        price
      });
      const amount = price.unit_amount || 0;
      if (amount == 4990) {
        plan = "starter";
      } else if (amount == 8990) {
        plan = "pro";
      }
      logStep("Active subscription found", {
        subscriptionId,
        plan,
        endDate: subscriptionEnd
      });
    } else {
      logStep("No active subscription found");
    }
    // Update company with subscription info
    await supabaseClient.from("companies").update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: plan,
      expiration_date: subscriptionEnd ? subscriptionEnd.split('T')[0] : null,
      status: hasActiveSub ? 'active' : 'inactive'
    }).eq('id', profile.company_id);
    logStep("Updated company with subscription info", {
      subscribed: hasActiveSub,
      plan
    });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub || company?.subscription_status === 'trialing',
      plan: plan,
      subscription_end: subscriptionEnd,
      status: company?.subscription_status || (hasActiveSub ? 'active' : 'inactive'),
      trial_end: company?.trial_end_date,
      is_trialing: company?.subscription_status === 'trialing',
      is_in_grace_period: company?.subscription_status === 'past_due' && company?.grace_period_end_date
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", {
      message: errorMessage
    });
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
