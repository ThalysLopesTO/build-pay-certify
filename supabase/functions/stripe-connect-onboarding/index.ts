import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeConnectConfig, logConnectMode } from "../_shared/stripeConnectConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    // Get company settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("company_settings")
      .select("stripe_connect_account_id, company_email, company_name")
      .eq("company_id", profile.company_id)
      .single();

    if (settingsError) {
      throw new Error("Company settings not found");
    }

    const stripe = new Stripe(connectConfig.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    let accountId = settings?.stripe_connect_account_id;

    // Create new Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log(`Creating new Stripe Connect account for company: ${profile.company_id} (mode: ${connectConfig.mode})`);
      
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
      console.log(`Created Stripe Connect account: ${accountId} (mode: ${connectConfig.mode})`);

      // Save account ID to company settings
      const { error: updateError } = await supabaseClient
        .from("company_settings")
        .update({ stripe_connect_account_id: accountId })
        .eq("company_id", profile.company_id);

      if (updateError) {
        console.error("Failed to save account ID:", updateError);
        throw new Error("Failed to save Stripe account");
      }
    }

    // Parse request body for return URLs
    const body = await req.json().catch(() => ({}));
    const origin = body.origin || "https://qsqjwpajvcmahoamwwww.lovableproject.com";

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/admin/settings?tab=payments&refresh=true`,
      return_url: `${origin}/admin/settings?tab=payments&success=true`,
      type: "account_onboarding",
    });

    console.log(`Created account link for: ${accountId} (mode: ${connectConfig.mode})`);

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in stripe-connect-onboarding:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
