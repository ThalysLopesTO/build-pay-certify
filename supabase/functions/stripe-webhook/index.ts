
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook event verified", { type: event.type, id: event.id });

    // Check if we've already processed this event
    const { data: existingEvent } = await supabaseClient
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      logStep("Event already processed", { eventId: event.id });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record this event as processed
    await supabaseClient.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type
    });

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabaseClient, stripe);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient, stripe);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, supabaseClient);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabaseClient: any, stripe: Stripe) {
  logStep("Handling checkout completion", { sessionId: session.id, customerId: session.customer });
  
  const customerId = session.customer as string;
  
  // Get customer details from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = (customer as Stripe.Customer).email;
  
  if (!customerEmail) {
    logStep("ERROR: No customer email found");
    return;
  }

  logStep("Customer email retrieved for pre-registration", { email: customerEmail, customerId });
  
  // Store pre-registration data for linking during company registration
  await supabaseClient.from('company_registration_requests').upsert({
    company_email: customerEmail,
    admin_email: customerEmail,
    company_name: 'Pending Registration',
    admin_first_name: 'Pending',
    admin_last_name: 'Registration',
    status: 'stripe_pending',
    stripe_customer_id: customerId,
    stripe_session_id: session.id
  }, { onConflict: 'company_email' });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabaseClient: any, stripe: Stripe) {
  logStep("Handling subscription change", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });
  
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const amount = subscription.items.data[0].price.unit_amount || 0;
  
  // Determine plan (single plan now)
  let plan = amount >= 29700 ? 'pro' : 'free';
  
  const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];
  
  // Update company record if it exists
  const { data: existingCompany } = await supabaseClient
    .from('companies')
    .select('id, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existingCompany) {
    // Update existing company
    await supabaseClient
      .from('companies')
      .update({
        stripe_subscription_id: subscription.id,
        plan: plan,
        subscription_status: status,
        trial_end_date: trialEnd?.toISOString(),
        expiration_date: subscriptionEnd,
        status: (status === 'active' || status === 'trialing') ? 'active' : 'inactive',
        stripe_verified: true,
        grace_period_end_date: null
      })
      .eq('stripe_customer_id', customerId);
      
    logStep("Updated existing company", { 
      customerId, 
      plan, 
      status, 
      trialEnd: trialEnd?.toISOString() 
    });
    
    // Send trial start email if trialing
    if (status === 'trialing' && trialEnd) {
      await sendTrialStartEmail(existingCompany, trialEnd, supabaseClient);
    }
  } else {
    // Update registration request status
    await supabaseClient
      .from('company_registration_requests')
      .update({
        status: 'stripe_verified',
        stripe_subscription_id: subscription.id
      })
      .eq('stripe_customer_id', customerId);
      
    logStep("Updated registration request for pre-registration", { customerId });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling subscription deletion", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  
  await supabaseClient
    .from('companies')
    .update({
      stripe_subscription_id: null,
      plan: 'free',
      expiration_date: null,
      status: 'inactive',
      stripe_verified: false
    })
    .eq('stripe_customer_id', customerId);
    
  logStep("Company updated for subscription deletion", { customerId });
}

async function handleTrialWillEnd(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling trial will end", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  const trialEnd = new Date(subscription.trial_end! * 1000);
  
  const { data: company } = await supabaseClient
    .from('companies')
    .select('id, name, stripe_customer_id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (company) {
    await sendTrialEndingEmail(company, trialEnd, supabaseClient);
    logStep("Trial ending email sent", { companyId: company.id, trialEnd: trialEnd.toISOString() });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment succeeded", { invoiceId: invoice.id });
  // Additional logic for successful payments if needed
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment failed", { invoiceId: invoice.id, customerId: invoice.customer });
  
  const customerId = invoice.customer as string;
  
  if (invoice.subscription) {
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);
    
    const { data: company } = await supabaseClient
      .from('companies')
      .update({
        subscription_status: 'past_due',
        grace_period_end_date: gracePeriodEnd.toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .select('id, name')
      .single();
      
    if (company) {
      logStep("Grace period set for failed payment", { 
        companyId: company.id,
        gracePeriodEnd: gracePeriodEnd.toISOString() 
      });
      
      await sendPaymentFailedEmail(company, gracePeriodEnd, supabaseClient);
    }
  }
}

async function sendTrialStartEmail(company: any, trialEnd: Date, supabaseClient: any) {
  logStep("Sending trial start email", { companyId: company.id });
  
  try {
    await supabaseClient.functions.invoke('send-trial-emails', {
      body: {
        email_type: 'trial_started',
        company_id: company.id,
        company_name: company.name,
        trial_end_date: trialEnd.toISOString()
      }
    });
  } catch (error: any) {
    logStep("Error sending trial start email", { error: error.message });
  }
}

async function sendTrialEndingEmail(company: any, trialEnd: Date, supabaseClient: any) {
  logStep("Sending trial ending email", { companyId: company.id });
  
  try {
    await supabaseClient.functions.invoke('send-trial-emails', {
      body: {
        email_type: 'trial_ending',
        company_id: company.id,
        company_name: company.name,
        trial_end_date: trialEnd.toISOString()
      }
    });
  } catch (error: any) {
    logStep("Error sending trial ending email", { error: error.message });
  }
}

async function sendPaymentFailedEmail(company: any, gracePeriodEnd: Date, supabaseClient: any) {
  logStep("Sending payment failed email", { companyId: company.id });
  
  try {
    await supabaseClient.functions.invoke('send-trial-emails', {
      body: {
        email_type: 'payment_failed',
        company_id: company.id,
        company_name: company.name,
        grace_period_end: gracePeriodEnd.toISOString()
      }
    });
  } catch (error: any) {
    logStep("Error sending payment failed email", { error: error.message });
  }
}
