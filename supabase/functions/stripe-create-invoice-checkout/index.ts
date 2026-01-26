import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode, logSecretDiagnostics, getAccountIdColumn } from "../_shared/stripeConnectConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-INVOICE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Log startup diagnostics on every invocation
  logSecretDiagnostics("stripe-create-invoice-checkout");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting invoice checkout creation");

    // Get Stripe Connect configuration (TEST or LIVE mode)
    const connectConfig = getStripeConnectConfig();
    logConnectMode(connectConfig, "STRIPE-INVOICE-CHECKOUT");

    const { invoice_id, portal_token, success_url, cancel_url } = await req.json();

    if (!invoice_id || !portal_token || !success_url || !cancel_url) {
      throw new Error("Missing required parameters: invoice_id, portal_token, success_url, cancel_url");
    }

    logStep("Parameters received", { invoice_id, portal_token });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Validate portal token and get client/company info
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, company_id, client_name, client_email')
      .eq('portal_token', portal_token)
      .single();

    if (clientError || !clientData) {
      logStep("Invalid portal token", { error: clientError?.message });
      throw new Error("Invalid portal token");
    }

    logStep("Client validated", { clientId: clientData.id, companyId: clientData.company_id });

    // Get invoice and validate it belongs to this client's company
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, title, total_amount, status, company_id, client_id')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      logStep("Invoice not found", { error: invoiceError?.message });
      throw new Error("Invoice not found");
    }

    if (invoice.company_id !== clientData.company_id) {
      logStep("Invoice company mismatch", { invoiceCompany: invoice.company_id, clientCompany: clientData.company_id });
      throw new Error("Invoice does not belong to this company");
    }

    if (invoice.status === 'paid') {
      throw new Error("Invoice is already paid");
    }

    logStep("Invoice validated", { invoiceNumber: invoice.invoice_number, total: invoice.total_amount });

    // Determine which column to use based on mode
    const accountIdColumn = getAccountIdColumn(connectConfig.mode);
    logStep("Reading account ID from column", { column: accountIdColumn, mode: connectConfig.mode });

    // Get company settings and verify payments are enabled - fetch mode-specific columns
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('payments_enabled, stripe_connect_account_id_test, stripe_connect_account_id_live, stripe_connect_charges_enabled, company_name, enable_live_invoice_payments')
      .eq('company_id', clientData.company_id)
      .single();

    if (settingsError || !settings) {
      logStep("Company settings not found", { error: settingsError?.message });
      throw new Error("Company settings not found");
    }

    if (!settings.payments_enabled) {
      throw new Error("Payments are not enabled for this company");
    }

    // Get the mode-specific account ID
    const stripeConnectAccountId = connectConfig.mode === 'live' 
      ? settings.stripe_connect_account_id_live 
      : settings.stripe_connect_account_id_test;

    logStep("Account ID retrieved", { 
      accountId: stripeConnectAccountId ? stripeConnectAccountId.substring(0, 12) + '...' : 'null',
      mode: connectConfig.mode 
    });

    if (!stripeConnectAccountId || !settings.stripe_connect_charges_enabled) {
      throw new Error(`Stripe Connect is not properly configured for this company in ${connectConfig.mode.toUpperCase()} mode`);
    }

    // LIVE MODE GUARDRAIL: Check if live payments are enabled for this company
    if (connectConfig.mode === 'live' && !settings.enable_live_invoice_payments) {
      logStep("Live payments not enabled for company", { 
        companyId: clientData.company_id,
        mode: connectConfig.mode,
        enableLivePayments: settings.enable_live_invoice_payments
      });
      throw new Error("Live invoice payments are not enabled for this company. Please contact support.");
    }

    logStep("Company settings validated", { 
      paymentsEnabled: settings.payments_enabled,
      chargesEnabled: settings.stripe_connect_charges_enabled,
      connectMode: connectConfig.mode,
      livePaymentsEnabled: settings.enable_live_invoice_payments
    });

    // Calculate amounts
    const amountTotalCents = Math.round(invoice.total_amount * 100);
    const applicationFeeCents = Math.round(amountTotalCents * 0.01); // 1% platform fee

    logStep("Amounts calculated", { 
      amountTotalCents, 
      applicationFeeCents,
      originalAmount: invoice.total_amount 
    });

    // Initialize Stripe with Connect configuration
    const stripe = new Stripe(connectConfig.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: invoice.title || undefined,
            },
            unit_amount: amountTotalCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: stripeConnectAccountId,
        },
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          company_id: clientData.company_id,
          type: 'invoice_payment',
        },
      },
      customer_email: clientData.client_email,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        company_id: clientData.company_id,
        type: 'invoice_payment',
        connect_mode: connectConfig.mode,
      },
      success_url: success_url,
      cancel_url: cancel_url,
    });

    logStep("Stripe session created", { sessionId: session.id, mode: connectConfig.mode });

    // Insert invoice_payments record
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        company_id: clientData.company_id,
        invoice_id: invoice.id,
        stripe_checkout_session_id: session.id,
        amount_total_cents: amountTotalCents,
        application_fee_cents: applicationFeeCents,
        currency: 'cad',
        status: 'created',
      });

    if (paymentError) {
      logStep("Error inserting invoice_payments", { error: paymentError.message });
      throw new Error("Failed to create payment record");
    }

    logStep("Invoice payment record created", { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
