-- Add Stripe-related columns to company_registration_requests for trial embed flow
ALTER TABLE public.company_registration_requests
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'standard';