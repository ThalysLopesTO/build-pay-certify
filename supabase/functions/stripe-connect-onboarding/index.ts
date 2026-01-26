import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode, logSecretDiagnostics, getAccountIdColumn } from "../_shared/stripeConnectConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Log startup diagnostics on every invocation
  logSecretDiagnostics("stripe-connect-onboarding");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe Connect configuration (TEST or LIVE mode)
    const connectConfig = getStripeConnectConfig();
    logConnectMode(connectConfig, "STRIPE-CONNECT-ONBOARDING");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get current user
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user profile to check role and company
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("company_id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Check if user is admin
    if (!["admin", "super_admin", "management"].includes(profile.role)) {
      throw new Error("Access denied: Admin role required");
    }

    // Determine which column to use based on mode
    const accountIdColumn = getAccountIdColumn(connectConfig.mode);
    console.log(`[STRIPE-CONNECT-ONBOARDING] Reading from column: ${accountIdColumn}`);

    // Get company settings - fetch both mode-specific columns
    const { data: settings, error: settingsError } = await supabaseClient
      .from("company_settings")
      .select("stripe_connect_account_id_test, stripe_connect_account_id_live, company_email, company_name")
      .eq("company_id", profile.company_id)
      .single();

    if (settingsError) {
      throw new Error("Company settings not found");
    }

    const stripe = new Stripe(connectConfig.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the mode-specific account ID
    let accountId = connectConfig.mode === 'live' 
      ? settings?.stripe_connect_account_id_live 
      : settings?.stripe_connect_account_id_test;

    console.log(`[STRIPE-CONNECT-ONBOARDING] Existing account ID for ${connectConfig.mode.toUpperCase()} mode: ${accountId ? accountId.substring(0, 12) + '...' : 'null'}`);

    // Create new Stripe Connect account if doesn't exist for this mode
    if (!accountId) {
      console.log(`[STRIPE-CONNECT-ONBOARDING] Creating new Stripe Connect account for company: ${profile.company_id} (mode: ${connectConfig.mode})`);
      
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: settings?.company_email || user.email,
        business_type: "company",
        company: {
          name: settings?.company_name || undefined,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log(`[STRIPE-CONNECT-ONBOARDING] Created Stripe Connect account: ${accountId.substring(0, 12)}... (mode: ${connectConfig.mode})`);

      // Save account ID to the mode-specific column
      const updateData: Record<string, string> = {};
      updateData[accountIdColumn] = accountId;
      
      console.log(`[STRIPE-CONNECT-ONBOARDING] Saving to column: ${accountIdColumn}`);

      const { error: updateError } = await supabaseClient
        .from("company_settings")
        .update(updateData)
        .eq("company_id", profile.company_id);

      if (updateError) {
        console.error("[STRIPE-CONNECT-ONBOARDING] Failed to save account ID:", updateError);
        throw new Error("Failed to save Stripe account");
      }
    }

    // Parse request body for return URLs
    const body = await req.json().catch(() => ({}));
    const origin = body.origin || "https://qsqjwpajvcmahoamwwww.lovableproject.com";

    // Try to create onboarding link - with error handling for invalid accounts
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/admin/dashboard?tab=company-settings&stripe=refresh`,
        return_url: `${origin}/admin/dashboard?tab=company-settings&stripe=return`,
        type: "account_onboarding",
      });

      console.log(`[STRIPE-CONNECT-ONBOARDING] Created account link for: ${accountId.substring(0, 12)}... (mode: ${connectConfig.mode})`);

      return new Response(
        JSON.stringify({ url: accountLink.url }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (stripeError) {
      // Handle case where account doesn't exist (e.g., mode mismatch or deleted account)
      const errorMessage = stripeError instanceof Error ? stripeError.message : String(stripeError);
      
      if (errorMessage.includes("No such account") || errorMessage.includes("account_invalid")) {
        console.log(`[STRIPE-CONNECT-ONBOARDING] Account ${accountId.substring(0, 12)}... not found in ${connectConfig.mode.toUpperCase()} mode. Creating new account.`);
        
        // Create a new account for this mode
        const newAccount = await stripe.accounts.create({
          type: "express",
          country: "CA",
          email: settings?.company_email || user.email,
          business_type: "company",
          company: {
            name: settings?.company_name || undefined,
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        accountId = newAccount.id;
        console.log(`[STRIPE-CONNECT-ONBOARDING] Created replacement account: ${accountId.substring(0, 12)}... (mode: ${connectConfig.mode})`);

        // Save the new account ID
        const updateData: Record<string, string> = {};
        updateData[accountIdColumn] = accountId;

        await supabaseClient
          .from("company_settings")
          .update(updateData)
          .eq("company_id", profile.company_id);

        // Create account link for the new account
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${origin}/admin/dashboard?tab=company-settings&stripe=refresh`,
          return_url: `${origin}/admin/dashboard?tab=company-settings&stripe=return`,
          type: "account_onboarding",
        });

        console.log(`[STRIPE-CONNECT-ONBOARDING] Created account link for new account: ${accountId.substring(0, 12)}...`);

        return new Response(
          JSON.stringify({ url: accountLink.url }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }

      // Re-throw other errors
      throw stripeError;
    }

  } catch (error) {
    console.error("[STRIPE-CONNECT-ONBOARDING] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
