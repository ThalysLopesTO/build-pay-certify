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
    // Get the user's memberships (a user may belong to multiple companies)
    const { data: profiles } = await supabaseClient
      .from('user_profiles')
      .select('company_id, role, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // Super admins don't need subscription checks
    if (profiles?.some((p)=>p.role === 'super_admin')) {
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
    
    // Resolve the ACTIVE company: pointer from user_active_company when it is
    // still a valid active membership, else the earliest membership (matches
    // the DB-side get_user_company_id() resolver)
    let activeCompanyId: string | null = null;
    if (profiles && profiles.length > 0) {
      const { data: pointer } = await supabaseClient
        .from('user_active_company')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();
      const pointerValid = pointer?.company_id
        ? profiles.find((p)=>p.company_id === pointer.company_id && p.is_active !== false)
        : null;
      activeCompanyId = pointerValid ? pointer!.company_id : profiles[0].company_id;
    }

    if (!activeCompanyId) {
      throw new Error("User not associated with a company");
    }

    // Get company subscription details including trial info and super admin flag
    const { data: company } = await supabaseClient
      .from('companies')
      .select('stripe_customer_id, subscription_status, trial_end_date, grace_period_end_date, created_by_super_admin, plan')
      .eq('id', activeCompanyId)
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
      }).eq('id', activeCompanyId);
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
      const amount = price.unit_amount || 0;
      
      // Map amounts (in cents) to plan IDs
      if (amount === 4990) {
        plan = "start";
      } else if (amount === 8990) {
        plan = "builder";
      } else if (amount === 12990) {
        plan = "builder_pro";
      } else if (amount >= 29700) {
        // Legacy $297 plan - map to builder_pro
        plan = "builder_pro";
      }
      
      logStep("Active subscription found", {
        subscriptionId,
        plan,
        priceId,
        amount,
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
    }).eq('id', activeCompanyId);
    logStep("Updated company with subscription info", {
      subscribed: hasActiveSub,
      plan
    });
    // Check if this is a super admin created company (exempt from subscription)
    const isSuperAdminCompany = company?.created_by_super_admin === true;
    const isTrialing = company?.subscription_status === 'trialing';
    const isGracePeriod = company?.subscription_status === 'past_due' && company?.grace_period_end_date;
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub || isTrialing || isSuperAdminCompany,
      plan: plan || company?.plan || 'free',
      subscription_end: subscriptionEnd,
      status: company?.subscription_status || (hasActiveSub ? 'active' : 'inactive'),
      trial_end: company?.trial_end_date,
      isTrialing: isTrialing,
      isGracePeriod: isGracePeriod,
      isSuperAdminCompany: isSuperAdminCompany,
      subscriptionStatus: company?.subscription_status
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
