
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function for consistent logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[CHECKOUT] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[CHECKOUT ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Function started");

    // Parse and validate request body
    const requestBody = await req.json();
    const { planType, customerEmail, isUnauthenticated } = requestBody;
    
    logStep("Parsed request body", { planType, customerEmail, isUnauthenticated });

    // Validate required parameters
    if (!planType) {
      logError("Missing planType parameter");
      return new Response(
        JSON.stringify({ error: "Plan type is required" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    // Validate environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      logError("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe configuration missing. Please contact support." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logError("Supabase configuration missing", { hasUrl: !!supabaseUrl, hasServiceRole: !!supabaseServiceRoleKey });
      return new Response(
        JSON.stringify({ error: "Database configuration missing. Please contact support." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    logStep("Environment variables validated");

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Handle enterprise plan special case
    if (planType.toLowerCase() === 'enterprise') {
      logStep("Enterprise plan requested, redirecting to sales");
      return new Response(
        JSON.stringify({
          redirectTo: 'mailto:sales@stackbuild.ca?subject=Enterprise Plan Inquiry'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Query subscription plans table
    logStep("Querying subscription plans", { planType: planType.toLowerCase() });
    
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('stripe_price_id, price_monthly, employee_limit, name')
      .eq('plan_type', planType.toLowerCase())
      .maybeSingle();

    if (planError) {
      logError("Database query failed", { error: planError.message });
      return new Response(
        JSON.stringify({ error: "Failed to retrieve plan information. Please try again." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    if (!plan) {
      logError("Plan not found in database", { planType });
      return new Response(
        JSON.stringify({ error: `Plan type '${planType}' not found. Please select a valid plan.` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    if (!plan.stripe_price_id) {
      logError("Missing Stripe price ID for plan", { planType, plan });
      return new Response(
        JSON.stringify({ error: "Plan configuration incomplete. Please contact support." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    logStep("Supabase plan found", { 
      planType, 
      stripePriceId: plan.stripe_price_id,
      priceMonthly: plan.price_monthly,
      employeeLimit: plan.employee_limit 
    });

    // Determine success and cancel URLs based on authentication status
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const successUrl = isUnauthenticated 
      ? `${origin}/register?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/subscription?session_id={CHECKOUT_SESSION_ID}`;
    
    const cancelUrl = isUnauthenticated
      ? `${origin}/subscription?cancelled=true`
      : `${origin}/subscription?cancelled=true`;

    logStep("Creating Stripe checkout session", { 
      successUrl, 
      cancelUrl, 
      customerEmail,
      stripePriceId: plan.stripe_price_id,
      isUnauthenticated 
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        plan_type: planType.toLowerCase(),
        price_monthly: plan.price_monthly?.toString() || '0',
        employee_limit: plan.employee_limit?.toString() || 'unlimited',
        is_unauthenticated_signup: isUnauthenticated ? 'true' : 'false'
      },
    });

    logStep("Stripe session created successfully", { 
      sessionId: session.id,
      url: session.url 
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logError("Unexpected error in checkout creation", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined 
    });

    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred. Please try again or contact support if the problem persists." 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
