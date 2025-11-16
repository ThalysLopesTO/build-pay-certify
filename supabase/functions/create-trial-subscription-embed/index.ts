import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan to Stripe Price ID mapping
const PLAN_PRICE_IDS: Record<string, string> = {
  'start': 'price_1SO2mKEuB2J4BS43soKlnGl1',
  'builder': 'price_1SO2nyEuB2J4BS43c9eFgZKj',
  'builder_pro': 'price_1SO2ocEuB2J4BS43BYcRT2Zs',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { companyName, fullName, email, phone, plan } = await req.json();

    // Validate required fields
    if (!companyName || !fullName || !email || !plan) {
      console.error('Missing required fields:', { companyName, fullName, email, plan });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: companyName, fullName, email, plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan
    if (!PLAN_PRICE_IDS[plan]) {
      console.error('Invalid plan:', plan);
      return new Response(
        JSON.stringify({ error: `Invalid plan: ${plan}. Must be one of: start, builder, builder_pro` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating trial subscription for:', { companyName, fullName, email, plan });

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment processing is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create Stripe Customer
    console.log('Creating Stripe customer...');
    const customer = await stripe.customers.create({
      email: email,
      name: fullName,
      phone: phone || undefined,
      metadata: {
        companyName: companyName,
        plan: plan,
        source: 'embed_trial',
        firstName: firstName,
        lastName: lastName,
      },
    });
    console.log('Stripe customer created:', customer.id);

    // Create Stripe Subscription with 14-day trial
    console.log('Creating Stripe subscription with trial...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PLAN_PRICE_IDS[plan] }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      collection_method: 'charge_automatically',
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: {
        companyName: companyName,
        plan: plan,
        source: 'embed_trial',
      },
    });
    console.log('Stripe subscription created:', subscription.id);

    // Extract client secret - try payment_intent first, then setup_intent
    let clientSecret: string | null = null;
    let intentType: 'payment' | 'setup' | null = null;

    const invoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;

    if (paymentIntent?.client_secret) {
      clientSecret = paymentIntent.client_secret;
      intentType = 'payment';
      console.log('Using PaymentIntent client_secret:', paymentIntent.id);
    } else if (subscription.pending_setup_intent) {
      const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
      if (!setupIntent.client_secret) {
        console.error('SetupIntent missing client_secret:', setupIntent.id);
        return new Response(
          JSON.stringify({ error: 'Failed to get SetupIntent client secret' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      clientSecret = setupIntent.client_secret;
      intentType = 'setup';
      console.log('Using SetupIntent client_secret:', setupIntent.client_secret);
    }

    if (!clientSecret || !intentType) {
      console.error('No payment_intent or setup_intent client_secret found for subscription', subscription.id);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize payment for trial subscription.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Insert registration request into database
    console.log('Inserting registration request into database...');
    const { data: registrationRequest, error: dbError } = await supabaseClient
      .from('company_registration_requests')
      .insert({
        company_name: companyName,
        company_email: email,
        company_phone: phone || null,
        admin_first_name: firstName,
        admin_last_name: lastName,
        admin_email: email,
        status: 'pending_payment',
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        source: 'embed_trial',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the whole request if DB insert fails - Stripe subscription is created
      // We can handle this via webhook later
      console.warn('Failed to create registration request, but Stripe subscription was created');
    } else {
      console.log('Registration request created:', registrationRequest.id);
    }

    // Return success response
    const response = {
      clientSecret: clientSecret,
      intentType: intentType,
      registrationRequestId: registrationRequest?.id || null,
      subscriptionId: subscription.id,
      customerId: customer.id,
    };

    console.log('Trial subscription created successfully with intentType:', intentType);
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-trial-subscription-embed:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
