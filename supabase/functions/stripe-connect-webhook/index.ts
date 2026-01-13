import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode } from "../_shared/stripeConnectConfig.ts";

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

serve(async (req) => {
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
      if (!invoiceId) {
        logStep("No invoice_id in metadata");
        return new Response(JSON.stringify({ received: true, error: "No invoice_id" }), { status: 200 });
      }

      // Update invoice_payments record
      const { error: paymentUpdateError } = await supabaseAdmin
        .from("invoice_payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_checkout_session_id", session.id);

      if (paymentUpdateError) {
        logStep("Error updating invoice_payments", { error: paymentUpdateError.message });
      } else {
        logStep("Updated invoice_payments record");
      }

      // Update invoice status
      const { error: invoiceUpdateError } = await supabaseAdmin
        .from("invoices")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (invoiceUpdateError) {
        logStep("Error updating invoice", { error: invoiceUpdateError.message });
      } else {
        logStep("Updated invoice status to paid", { invoice_id: invoiceId });
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
        // Update invoice_payments by payment intent id
        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        // Update invoice
        await supabaseAdmin
          .from("invoices")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", invoiceId);

        logStep("Updated records from payment_intent.succeeded", { invoice_id: invoiceId });
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
        if (invoiceId) {
          // Update via payment intent ID if available
          if (charge.payment_intent) {
            await supabaseAdmin
              .from("invoice_payments")
              .update({
                status: "completed",
                paid_at: new Date().toISOString(),
                stripe_payment_intent_id: charge.payment_intent as string,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_payment_intent_id", charge.payment_intent);
          }

          await supabaseAdmin
            .from("invoices")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("id", invoiceId);

          logStep("Updated records from charge.succeeded", { invoice_id: invoiceId });
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
