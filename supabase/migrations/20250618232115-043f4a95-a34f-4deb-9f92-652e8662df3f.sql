
-- Add Stripe-related columns to companies table
ALTER TABLE public.companies 
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_verified BOOLEAN DEFAULT false;

-- Add Stripe-related columns to user_profiles table for user verification
ALTER TABLE public.user_profiles 
ADD COLUMN stripe_verified BOOLEAN DEFAULT false,
ADD COLUMN stripe_verification_status TEXT;

-- Create a table to track Stripe webhook events (to prevent duplicate processing)
CREATE TABLE public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stripe_webhook_events (system table)
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for system access only
CREATE POLICY "System access only" ON public.stripe_webhook_events
  FOR ALL USING (false);
