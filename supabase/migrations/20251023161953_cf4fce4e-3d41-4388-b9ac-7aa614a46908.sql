-- Add webhook integration columns to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS webhook_secret text,
ADD COLUMN IF NOT EXISTS webhook_enabled boolean DEFAULT false;

-- Add helpful comments
COMMENT ON COLUMN company_settings.webhook_url IS 'Webhook endpoint URL for daily punch summaries';
COMMENT ON COLUMN company_settings.webhook_secret IS 'Secret key for HMAC-SHA256 signature verification (optional)';
COMMENT ON COLUMN company_settings.webhook_enabled IS 'Whether webhooks are enabled for this company';