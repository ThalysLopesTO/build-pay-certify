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

// Extract fee breakdown from Stripe objects
const extractFeeBreakdown = async (
  stripe: Stripe, 
  paymentIntentId: string
): Promise<{
  stripe_payment_intent_id: string;
  stripe_charge_id: string | null;
  stripe_balance_transaction_id: string | null;
  stripe_transfer_id: string | null;
  stripe_processing_fee_cents: number | null;
  stackbuild_fee_cents: number | null;
  net_to_company_cents: number | null;
  payment_currency: string | null;
  payment_method_type: string | null;
}> => {
  const result = {
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: null as string | null,
    stripe_balance_transaction_id: null as string | null,
    stripe_transfer_id: null as string | null,
    stripe_processing_fee_cents: null as number | null,
    stackbuild_fee_cents: null as number | null,
    net_to_company_cents: null as number | null,
    payment_currency: null as string | null,
    payment_method_type: null as string | null,
  };

  try {
    // Retrieve PaymentIntent with charges expanded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges.data.balance_transaction']
    });

    logStep("Retrieved PaymentIntent for fee extraction", { 
      id: paymentIntent.id,
      application_fee_amount: paymentIntent.application_fee_amount 
    });

    // Get application fee (StackBuild 1% fee)
    if (paymentIntent.application_fee_amount) {
      result.stackbuild_fee_cents = paymentIntent.application_fee_amount;
    }

    // Get the charge
    const charges = paymentIntent.charges?.data;
    if (charges && charges.length > 0) {
      const charge = charges[0];
      result.stripe_charge_id = charge.id;
      result.payment_currency = charge.currency;
      
      logStep("Found charge", { 
        charge_id: charge.id, 
        currency: charge.currency,
        transfer: charge.transfer 
      });

      // Get payment method type
      if (charge.payment_method_details?.type) {
        result.payment_method_type = charge.payment_method_details.type;
      }

      // Get transfer ID if present
      if (charge.transfer) {
        result.stripe_transfer_id = typeof charge.transfer === 'string' 
          ? charge.transfer 
          : charge.transfer.id;
      }

      // Get balance transaction for fees
      const balanceTx = charge.balance_transaction;
      if (balanceTx && typeof balanceTx !== 'string') {
        result.stripe_balance_transaction_id = balanceTx.id;
        result.stripe_processing_fee_cents = balanceTx.fee;
        result.net_to_company_cents = balanceTx.net;
        
        logStep("Found balance transaction", { 
          id: balanceTx.id, 
          fee: balanceTx.fee, 
          net: balanceTx.net 
        });
      }
    }
  } catch (err) {
    logStep("Error extracting fee breakdown", { error: String(err) });
  }

  return result;
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

      const paymentIntentId = session.payment_intent as string;
      
      // Extract fee breakdown from Stripe
      const feeBreakdown = await extractFeeBreakdown(stripe, paymentIntentId);
      logStep("Extracted fee breakdown", feeBreakdown);

      // Update invoice_payments record
      await supabaseAdmin
        .from("invoice_payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update invoice status with full fee breakdown
      await supabaseAdmin
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: feeBreakdown.stripe_payment_intent_id,
          stripe_charge_id: feeBreakdown.stripe_charge_id,
          stripe_balance_transaction_id: feeBreakdown.stripe_balance_transaction_id,
          stripe_transfer_id: feeBreakdown.stripe_transfer_id,
          stripe_processing_fee_cents: feeBreakdown.stripe_processing_fee_cents,
          stackbuild_fee_cents: feeBreakdown.stackbuild_fee_cents,
          net_to_company_cents: feeBreakdown.net_to_company_cents,
          payment_currency: feeBreakdown.payment_currency,
          payment_method_type: feeBreakdown.payment_method_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice_id);

      logStep("Records updated successfully with fee breakdown");

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
      const paymentIntentId = session.payment_intent as string;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      logStep("Retrieved PaymentIntent", { status: paymentIntent.status });

      if (paymentIntent.status === "succeeded") {
        // Payment succeeded but we missed it, update now with fee breakdown
        const feeBreakdown = await extractFeeBreakdown(stripe, paymentIntentId);
        logStep("Extracted fee breakdown for missed payment", feeBreakdown);

        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await supabaseAdmin
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: feeBreakdown.stripe_payment_intent_id,
            stripe_charge_id: feeBreakdown.stripe_charge_id,
            stripe_balance_transaction_id: feeBreakdown.stripe_balance_transaction_id,
            stripe_transfer_id: feeBreakdown.stripe_transfer_id,
            stripe_processing_fee_cents: feeBreakdown.stripe_processing_fee_cents,
            stackbuild_fee_cents: feeBreakdown.stackbuild_fee_cents,
            net_to_company_cents: feeBreakdown.net_to_company_cents,
            payment_currency: feeBreakdown.payment_currency,
            payment_method_type: feeBreakdown.payment_method_type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice_id);

        logStep("Records updated successfully with fee breakdown (missed payment)");

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
