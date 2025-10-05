-- Add trial tracking columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP WITH TIME ZONE;

-- Update subscription_status column if it doesn't have proper default
ALTER TABLE public.companies 
ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- Add comment for documentation
COMMENT ON COLUMN public.companies.trial_end_date IS 'End date of the 7-day trial period';
COMMENT ON COLUMN public.companies.subscription_status IS 'Current subscription status: trialing, active, past_due, canceled, inactive';
COMMENT ON COLUMN public.companies.grace_period_end_date IS 'End date of 5-day grace period after payment failure';

-- Create stripe_webhook_events table for idempotency if not exists
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stripe_webhook_events
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook events
CREATE POLICY "Service role can manage webhook events"
  ON public.stripe_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');