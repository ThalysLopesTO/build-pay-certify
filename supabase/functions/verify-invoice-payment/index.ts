import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode } from "../_shared/stripeConnectConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[verify-invoice-payment] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, portal_token } = await req.json();
    logStep("Request received", { invoice_id, hasToken: !!portal_token });

    if (!invoice_id || !portal_token) {
      throw new Error("Missing invoice_id or portal_token");
    }

    // Get Stripe Connect config
    const connectConfig = getStripeConnectConfig();
    logConnectMode(connectConfig, "verify-invoice-payment");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate portal token
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, company_id")
      .eq("portal_token", portal_token)
      .single();

    if (clientError || !client) {
      logStep("Invalid portal token");
      throw new Error("Invalid portal token");
    }

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id, status, company_id, client_id")
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      logStep("Invoice not found");
      throw new Error("Invoice not found");
    }

    // Verify client owns this invoice
    if (invoice.client_id !== client.id) {
      logStep("Client does not own this invoice");
      throw new Error("Unauthorized");
    }

    // If already paid, return success
    if (invoice.status === "paid") {
      logStep("Invoice already paid");
      return new Response(JSON.stringify({ status: "succeeded", invoice_status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the most recent payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (paymentError || !payment) {
      logStep("No payment record found");
      return new Response(JSON.stringify({ status: "no_payment", invoice_status: invoice.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Found payment record", { 
      payment_id: payment.id, 
      status: payment.status,
      session_id: payment.stripe_checkout_session_id 
    });

    // If payment already completed, return
    if (payment.status === "completed") {
      return new Response(JSON.stringify({ status: "succeeded", invoice_status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Stripe with Connect config
    const stripe = new Stripe(connectConfig.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check the checkout session status
    if (!payment.stripe_checkout_session_id) {
      logStep("No checkout session ID");
      return new Response(JSON.stringify({ status: "pending", invoice_status: invoice.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
    logStep("Retrieved Stripe session", { 
      session_status: session.status, 
      payment_status: session.payment_status,
      payment_intent: session.payment_intent 
    });

    // If session completed and payment succeeded
    if (session.status === "complete" && session.payment_status === "paid") {
      logStep("Payment confirmed as successful, updating records");

      // Update invoice_payments record
      await supabaseAdmin
        .from("invoice_payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update invoice status
      await supabaseAdmin
        .from("invoices")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice_id);

      logStep("Records updated successfully");

      return new Response(JSON.stringify({ status: "succeeded", invoice_status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if session expired or cancelled
    if (session.status === "expired") {
      logStep("Session expired");
      await supabaseAdmin
        .from("invoice_payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payment.id);

      return new Response(JSON.stringify({ status: "expired", invoice_status: invoice.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have a payment intent, check its status directly
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      logStep("Retrieved PaymentIntent", { status: paymentIntent.status });

      if (paymentIntent.status === "succeeded") {
        // Payment succeeded but we missed it, update now
        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await supabaseAdmin
          .from("invoices")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", invoice_id);

        return new Response(JSON.stringify({ status: "succeeded", invoice_status: "paid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (paymentIntent.status === "canceled" || paymentIntent.status === "requires_payment_method") {
        await supabaseAdmin
          .from("invoice_payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", payment.id);

        return new Response(JSON.stringify({ status: "failed", invoice_status: invoice.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Still processing
      return new Response(JSON.stringify({ 
        status: "processing", 
        payment_intent_status: paymentIntent.status,
        invoice_status: invoice.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Session still open/pending
    return new Response(JSON.stringify({ 
      status: "processing", 
      session_status: session.status,
      invoice_status: invoice.status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
