/**
 * Stripe Connect Configuration Helper
 * 
 * This module provides configuration for Stripe Connect functionality,
 * allowing separate TEST and LIVE mode operation while keeping
 * subscription billing unchanged.
 * 
 * Environment Variables:
 * - STRIPE_CONNECT_MODE: "test" or "live" (defaults to "live")
 * - STRIPE_SECRET_KEY_TEST: Test mode secret key (sk_test_...)
 * - STRIPE_SECRET_KEY_LIVE: Live mode secret key (sk_live_...)
 * - STRIPE_WEBHOOK_SECRET_CONNECT_TEST: Test webhook secret (primary)
 * - STRIPE_WEBHOOK_SECRET_CONNECT_TEST_ALT: Test webhook secret (alternate for thin payloads)
 * - STRIPE_WEBHOOK_SECRET_CONNECT_LIVE: Live webhook secret (primary)
 * - STRIPE_WEBHOOK_SECRET_CONNECT_LIVE_ALT: Live webhook secret (alternate)
 * 
 * Fallback:
 * - STRIPE_SECRET_KEY: Legacy key (used if mode-specific key is missing)
 * - STRIPE_WEBHOOK_SECRET: Legacy webhook secret (used if Connect-specific secrets are missing)
 */

export interface StripeConnectConfig {
  stripeSecretKey: string;
  webhookSecret?: string;
  webhookSecretAlt?: string;
  mode: 'test' | 'live';
  usingLegacyKey: boolean;
  usingLegacyWebhook: boolean;
}

/**
 * Log which secrets are detected (presence only, never values).
 * Call this at the start of each Connect function for diagnostics.
 */
export function logSecretDiagnostics(functionName: string): void {
  const mode = Deno.env.get("STRIPE_CONNECT_MODE") || "(default: live)";
  
  console.log(`[${functionName}] Startup diagnostics:`);
  console.log(`  STRIPE_CONNECT_MODE=${mode}`);
  console.log(`  has_STRIPE_SECRET_KEY_TEST=${!!Deno.env.get("STRIPE_SECRET_KEY_TEST")}`);
  console.log(`  has_STRIPE_SECRET_KEY_LIVE=${!!Deno.env.get("STRIPE_SECRET_KEY_LIVE")}`);
  console.log(`  has_STRIPE_SECRET_KEY=(legacy)=${!!Deno.env.get("STRIPE_SECRET_KEY")}`);
  console.log(`  has_STRIPE_WEBHOOK_SECRET_CONNECT_TEST=${!!Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST")}`);
  console.log(`  has_STRIPE_WEBHOOK_SECRET_CONNECT_TEST_ALT=${!!Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST_ALT")}`);
  console.log(`  has_STRIPE_WEBHOOK_SECRET_CONNECT_LIVE=${!!Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_LIVE")}`);
  console.log(`  has_STRIPE_WEBHOOK_SECRET_CONNECT_LIVE_ALT=${!!Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_LIVE_ALT")}`);
  console.log(`  has_STRIPE_WEBHOOK_SECRET=(legacy)=${!!Deno.env.get("STRIPE_WEBHOOK_SECRET")}`);
}

/**
 * Get Stripe Connect configuration based on STRIPE_CONNECT_MODE environment variable.
 * Returns the appropriate secret key and webhook secret for the current mode.
 * Falls back to legacy secrets if mode-specific secrets are missing.
 * 
 * @throws Error if no usable secret key is found
 */
export function getStripeConnectConfig(): StripeConnectConfig {
  const mode = (Deno.env.get("STRIPE_CONNECT_MODE") || "live") as 'test' | 'live';
  
  // Mode-specific keys
  const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
  const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
  
  // Mode-specific webhook secrets
  const testWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST");
  const testWebhookSecretAlt = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST_ALT");
  const liveWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_LIVE");
  const liveWebhookSecretAlt = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_LIVE_ALT");
  
  // Legacy fallbacks
  const legacyKey = Deno.env.get("STRIPE_SECRET_KEY");
  const legacyWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (mode === "test") {
    // Determine which key to use
    let stripeSecretKey = testKey;
    let usingLegacyKey = false;
    
    if (!stripeSecretKey) {
      if (legacyKey) {
        console.warn("[STRIPE-CONNECT-CONFIG] Warning: Using legacy STRIPE_SECRET_KEY for Connect TEST mode. Configure STRIPE_SECRET_KEY_TEST for proper separation.");
        stripeSecretKey = legacyKey;
        usingLegacyKey = true;
      } else {
        throw new Error("STRIPE_SECRET_KEY_TEST is not configured and no legacy STRIPE_SECRET_KEY available");
      }
    }
    
    // Determine webhook secrets
    let webhookSecret = testWebhookSecret;
    let webhookSecretAlt = testWebhookSecretAlt;
    let usingLegacyWebhook = false;
    
    if (!webhookSecret && !webhookSecretAlt) {
      if (legacyWebhookSecret) {
        console.warn("[STRIPE-CONNECT-CONFIG] Warning: Using legacy STRIPE_WEBHOOK_SECRET for Connect TEST mode. Configure STRIPE_WEBHOOK_SECRET_CONNECT_TEST for proper separation.");
        webhookSecret = legacyWebhookSecret;
        usingLegacyWebhook = true;
      }
    }
    
    return { 
      stripeSecretKey, 
      webhookSecret,
      webhookSecretAlt,
      mode,
      usingLegacyKey,
      usingLegacyWebhook,
    };
  } else {
    // LIVE mode
    let stripeSecretKey = liveKey;
    let usingLegacyKey = false;
    
    if (!stripeSecretKey) {
      if (legacyKey) {
        console.warn("[STRIPE-CONNECT-CONFIG] Warning: Using legacy STRIPE_SECRET_KEY for Connect LIVE mode. Configure STRIPE_SECRET_KEY_LIVE for proper separation.");
        stripeSecretKey = legacyKey;
        usingLegacyKey = true;
      } else {
        throw new Error("STRIPE_SECRET_KEY_LIVE is not configured and no legacy STRIPE_SECRET_KEY available");
      }
    }
    
    // Determine webhook secrets for LIVE mode
    let webhookSecret = liveWebhookSecret;
    let webhookSecretAlt = liveWebhookSecretAlt;
    let usingLegacyWebhook = false;
    
    if (!webhookSecret && !webhookSecretAlt) {
      if (legacyWebhookSecret) {
        console.warn("[STRIPE-CONNECT-CONFIG] Warning: Using legacy STRIPE_WEBHOOK_SECRET for Connect LIVE mode. Configure STRIPE_WEBHOOK_SECRET_CONNECT_LIVE for proper separation.");
        webhookSecret = legacyWebhookSecret;
        usingLegacyWebhook = true;
      }
    }
    
    return { 
      stripeSecretKey, 
      webhookSecret,
      webhookSecretAlt,
      mode,
      usingLegacyKey,
      usingLegacyWebhook,
    };
  }
}

/**
 * Log the current Stripe Connect mode and key prefix for debugging.
 * Does NOT log full secrets - only the prefix (sk_test or sk_live).
 * 
 * @param config - The Stripe Connect configuration
 * @param functionName - The name of the function for log context
 */
export function logConnectMode(config: StripeConnectConfig, functionName: string): void {
  const keyPrefix = config.stripeSecretKey.substring(0, 7); // "sk_test" or "sk_live"
  const legacyNote = config.usingLegacyKey ? " [LEGACY FALLBACK]" : "";
  const webhookNote = config.usingLegacyWebhook ? " [LEGACY WEBHOOK]" : "";
  console.log(`[${functionName}] Stripe Connect mode: ${config.mode.toUpperCase()} (key prefix: ${keyPrefix}...)${legacyNote}${webhookNote}`);
}
