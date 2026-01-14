import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode, logSecretDiagnostics } from "../_shared/stripeConnectConfig.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[stripe-connect-webhook] ${step}${detailsStr}`);
};

// Helper to verify webhook signature with multiple secrets (for TEST mode)
function verifyWebhookWithMultipleSecrets(
  stripe: Stripe,
  body: string,
  signature: string,
  primarySecret?: string,
  altSecret?: string
): { event: Stripe.Event | null; verified: boolean; secretUsed: string } {
  // Try primary secret first
  if (primarySecret) {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, primarySecret);
      return { event, verified: true, secretUsed: 'primary' };
    } catch (err) {
      logStep("Primary secret verification failed, trying alternate...", { 
        error: err instanceof Error ? err.message : "Unknown" 
      });
    }
  }

  // Try alternate secret (thin payload secret)
  if (altSecret) {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, altSecret);
      return { event, verified: true, secretUsed: 'alternate' };
    } catch (err) {
      logStep("Alternate secret verification also failed", { 
        error: err instanceof Error ? err.message : "Unknown" 
      });
    }
  }

  return { event: null, verified: false, secretUsed: 'none' };
}

// Helper to extract fee breakdown from Stripe objects
async function extractFeeBreakdown(
  stripe: Stripe,
  paymentIntentId: string,
  chargeId?: string
): Promise<{
  stripeProcessingFeeCents: number | null;
  stackbuildFeeCents: number | null;
  netToCompanyCents: number | null;
  balanceTransactionId: string | null;
  transferId: string | null;
  currency: string;
  paymentMethodType: string | null;
}> {
  try {
    // Retrieve the PaymentIntent with expanded charges
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges.data.balance_transaction', 'application_fee_amount'],
    });

    logStep("Retrieved PaymentIntent for fee breakdown", { 
      pi_id: paymentIntent.id,
      application_fee_amount: paymentIntent.application_fee_amount 
    });

    // Get the first charge
    const charge = paymentIntent.latest_charge 
      ? (typeof paymentIntent.latest_charge === 'string' 
          ? await stripe.charges.retrieve(paymentIntent.latest_charge, { expand: ['balance_transaction'] })
          : paymentIntent.latest_charge)
      : null;

    if (!charge) {
      logStep("No charge found for PaymentIntent");
      return {
        stripeProcessingFeeCents: null,
        stackbuildFeeCents: paymentIntent.application_fee_amount || null,
        netToCompanyCents: null,
        balanceTransactionId: null,
        transferId: null,
        currency: paymentIntent.currency,
        paymentMethodType: null,
      };
    }

    logStep("Retrieved Charge", { 
      charge_id: charge.id,
      balance_transaction: charge.balance_transaction,
      transfer: charge.transfer
    });

    // Get the balance transaction for fee details
    let balanceTransaction: Stripe.BalanceTransaction | null = null;
    if (charge.balance_transaction) {
      if (typeof charge.balance_transaction === 'string') {
        balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
      } else {
        balanceTransaction = charge.balance_transaction as Stripe.BalanceTransaction;
      }
    }

    logStep("Balance Transaction details", {
      bt_id: balanceTransaction?.id,
      fee: balanceTransaction?.fee,
      net: balanceTransaction?.net,
    });

    // Extract transfer ID if present
    const transferId = charge.transfer 
      ? (typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id)
      : null;

    // Get payment method type
    const paymentMethodType = charge.payment_method_details?.type || null;

    return {
      stripeProcessingFeeCents: balanceTransaction?.fee ?? null,
      stackbuildFeeCents: paymentIntent.application_fee_amount || null,
      netToCompanyCents: balanceTransaction?.net ?? null,
      balanceTransactionId: balanceTransaction?.id ?? null,
      transferId,
      currency: paymentIntent.currency,
      paymentMethodType,
    };
  } catch (error) {
    logStep("Error extracting fee breakdown", { 
      error: error instanceof Error ? error.message : "Unknown" 
    });
    return {
      stripeProcessingFeeCents: null,
      stackbuildFeeCents: null,
      netToCompanyCents: null,
      balanceTransactionId: null,
      transferId: null,
      currency: 'cad',
      paymentMethodType: null,
    };
  }
}

serve(async (req) => {
  // Log startup diagnostics on every invocation
  logSecretDiagnostics("stripe-connect-webhook");
  
  try {
    const connectConfig = getStripeConnectConfig();
    logConnectMode(connectConfig, "stripe-connect-webhook");

    const hasAnySecret = connectConfig.webhookSecret || connectConfig.webhookSecretAlt;
    if (!hasAnySecret) {
      logStep("Warning: No webhook secrets configured for Connect mode", { mode: connectConfig.mode });
    }

    const stripe = new Stripe(connectConfig.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (hasAnySecret && signature) {
      const result = verifyWebhookWithMultipleSecrets(
        stripe,
        body,
        signature,
        connectConfig.webhookSecret,
        connectConfig.webhookSecretAlt
      );

      if (!result.verified || !result.event) {
        logStep("Webhook signature verification failed with all secrets");
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }

      event = result.event;
      logStep("Webhook signature verified", { secretUsed: result.secretUsed });
    } else {
      // Parse event without verification (dev/testing only)
      event = JSON.parse(body) as Stripe.Event;
      logStep("Processing event without signature verification (no webhook secret or signature)");
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { 
        session_id: session.id,
        metadata: session.metadata 
      });

      // Only process invoice payments
      if (session.metadata?.type !== "invoice_payment") {
        logStep("Ignoring non-invoice payment session");
        return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
      }

      const invoiceId = session.metadata?.invoice_id;
      const paymentIntentId = session.payment_intent as string;
      
      if (!invoiceId) {
        logStep("No invoice_id in metadata");
        return new Response(JSON.stringify({ received: true, error: "No invoice_id" }), { status: 200 });
      }

      // IDEMPOTENCY CHECK: Skip if invoice is already paid
      const { data: existingInvoice } = await supabaseAdmin
        .from("invoices")
        .select("status")
        .eq("id", invoiceId)
        .single();

      if (existingInvoice?.status === "paid") {
        logStep("Invoice already paid (idempotent skip)", { invoice_id: invoiceId });
        return new Response(JSON.stringify({ received: true, already_paid: true }), { status: 200 });
      }

      // Extract fee breakdown from Stripe
      const feeBreakdown = await extractFeeBreakdown(stripe, paymentIntentId);
      logStep("Fee breakdown extracted", feeBreakdown);

      // Update invoice_payments record
      const { error: paymentUpdateError } = await supabaseAdmin
        .from("invoice_payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_checkout_session_id", session.id);

      if (paymentUpdateError) {
        logStep("Error updating invoice_payments", { error: paymentUpdateError.message });
      } else {
        logStep("Updated invoice_payments record");
      }

      // Update invoice with fee breakdown
      const { error: invoiceUpdateError } = await supabaseAdmin
        .from("invoices")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          stripe_balance_transaction_id: feeBreakdown.balanceTransactionId,
          stripe_transfer_id: feeBreakdown.transferId,
          stripe_processing_fee_cents: feeBreakdown.stripeProcessingFeeCents,
          stackbuild_fee_cents: feeBreakdown.stackbuildFeeCents,
          net_to_company_cents: feeBreakdown.netToCompanyCents,
          payment_currency: feeBreakdown.currency,
          payment_method_type: feeBreakdown.paymentMethodType,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (invoiceUpdateError) {
        logStep("Error updating invoice with fees", { error: invoiceUpdateError.message });
      } else {
        logStep("Updated invoice with fee breakdown", { invoice_id: invoiceId });
      }

      return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
    }

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Processing payment_intent.succeeded", { 
        payment_intent_id: paymentIntent.id,
        metadata: paymentIntent.metadata 
      });

      if (paymentIntent.metadata?.type !== "invoice_payment") {
        logStep("Ignoring non-invoice payment intent");
        return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
      }

      const invoiceId = paymentIntent.metadata?.invoice_id;
      if (invoiceId) {
        // Extract fee breakdown
        const feeBreakdown = await extractFeeBreakdown(stripe, paymentIntent.id);
        logStep("Fee breakdown extracted for PI", feeBreakdown);

        // Update invoice_payments by payment intent id
        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        // Update invoice with fee breakdown
        await supabaseAdmin
          .from("invoices")
          .update({ 
            status: "paid", 
            stripe_payment_intent_id: paymentIntent.id,
            stripe_balance_transaction_id: feeBreakdown.balanceTransactionId,
            stripe_transfer_id: feeBreakdown.transferId,
            stripe_processing_fee_cents: feeBreakdown.stripeProcessingFeeCents,
            stackbuild_fee_cents: feeBreakdown.stackbuildFeeCents,
            net_to_company_cents: feeBreakdown.netToCompanyCents,
            payment_currency: feeBreakdown.currency,
            payment_method_type: feeBreakdown.paymentMethodType,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        logStep("Updated records from payment_intent.succeeded with fees", { invoice_id: invoiceId });
      }

      return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
    }

    // Handle charge.succeeded (often fires alongside payment_intent.succeeded)
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      logStep("Processing charge.succeeded", { 
        charge_id: charge.id,
        payment_intent: charge.payment_intent,
        metadata: charge.metadata 
      });

      // Check metadata for invoice payment marker
      if (charge.metadata?.type === "invoice_payment") {
        const invoiceId = charge.metadata?.invoice_id;
        const paymentIntentId = charge.payment_intent as string;

        if (invoiceId && paymentIntentId) {
          // Extract fee breakdown
          const feeBreakdown = await extractFeeBreakdown(stripe, paymentIntentId, charge.id);
          logStep("Fee breakdown extracted for charge", feeBreakdown);

          // Update via payment intent ID if available
          await supabaseAdmin
            .from("invoice_payments")
            .update({
              status: "completed",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntentId,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", paymentIntentId);

          // Update invoice with all fee data
          await supabaseAdmin
            .from("invoices")
            .update({ 
              status: "paid",
              stripe_payment_intent_id: paymentIntentId,
              stripe_charge_id: charge.id,
              stripe_balance_transaction_id: feeBreakdown.balanceTransactionId,
              stripe_transfer_id: feeBreakdown.transferId,
              stripe_processing_fee_cents: feeBreakdown.stripeProcessingFeeCents,
              stackbuild_fee_cents: feeBreakdown.stackbuildFeeCents,
              net_to_company_cents: feeBreakdown.netToCompanyCents,
              payment_currency: feeBreakdown.currency,
              payment_method_type: feeBreakdown.paymentMethodType,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId);

          logStep("Updated records from charge.succeeded with fees", { invoice_id: invoiceId });
        }

        return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
      }

      logStep("Ignoring non-invoice charge");
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Processing payment_intent.payment_failed", { 
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message
      });

      if (paymentIntent.metadata?.type === "invoice_payment") {
        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        logStep("Marked payment as failed");
      }

      return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
    }

    // Unhandled event type
    logStep("Unhandled event type", { type: event.type });
    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error processing webhook", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
