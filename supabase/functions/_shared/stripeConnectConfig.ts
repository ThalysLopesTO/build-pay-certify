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
 * - STRIPE_WEBHOOK_SECRET_CONNECT_TEST: Test webhook secret (optional)
 * - STRIPE_WEBHOOK_SECRET_CONNECT_LIVE: Live webhook secret (optional)
 */

export interface StripeConnectConfig {
  stripeSecretKey: string;
  webhookSecret?: string;
  webhookSecretAlt?: string; // Alternate secret for thin payloads (TEST mode)
  mode: 'test' | 'live';
}

/**
 * Get Stripe Connect configuration based on STRIPE_CONNECT_MODE environment variable.
 * Returns the appropriate secret key and webhook secret for the current mode.
 * 
 * @throws Error if required environment variables are not configured
 */
export function getStripeConnectConfig(): StripeConnectConfig {
  const mode = (Deno.env.get("STRIPE_CONNECT_MODE") || "live") as 'test' | 'live';
  
  const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
  const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
  const testWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST");
  const testWebhookSecretAlt = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_TEST_ALT");
  const liveWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT_LIVE");
  
  if (mode === "test") {
    if (!testKey) {
      throw new Error("STRIPE_SECRET_KEY_TEST is not configured. Required when STRIPE_CONNECT_MODE=test");
    }
    return { 
      stripeSecretKey: testKey, 
      webhookSecret: testWebhookSecret,
      webhookSecretAlt: testWebhookSecretAlt,
      mode 
    };
  } else {
    if (!liveKey) {
      throw new Error("STRIPE_SECRET_KEY_LIVE is not configured. Required when STRIPE_CONNECT_MODE=live");
    }
    return { 
      stripeSecretKey: liveKey, 
      webhookSecret: liveWebhookSecret, 
      mode 
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
  console.log(`[${functionName}] Stripe Connect mode: ${config.mode.toUpperCase()} (key prefix: ${keyPrefix}...)`);
}
