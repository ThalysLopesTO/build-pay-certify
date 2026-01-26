-- Add environment-specific Stripe Connect account ID columns
-- This allows separate account IDs for TEST and LIVE Stripe modes

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS stripe_connect_account_id_test TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id_live TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.company_settings.stripe_connect_account_id_test IS 'Stripe Connect Express account ID for TEST mode';
COMMENT ON COLUMN public.company_settings.stripe_connect_account_id_live IS 'Stripe Connect Express account ID for LIVE mode';