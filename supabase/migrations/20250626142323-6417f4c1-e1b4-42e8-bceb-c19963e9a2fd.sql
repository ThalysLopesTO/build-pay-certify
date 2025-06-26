
-- Create subscriptions table to cache Stripe subscription data
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive', -- active, canceled, past_due, etc.
  plan_type TEXT NOT NULL DEFAULT 'free', -- basic, premium, enterprise
  employee_limit INTEGER, -- NULL means unlimited
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to check if user can add employees
CREATE OR REPLACE FUNCTION public.can_add_employee_with_subscription(company_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN s.employee_limit IS NULL THEN true  -- Unlimited
      WHEN s.status != 'active' THEN false     -- Inactive subscription
      WHEN public.get_company_employee_count(company_id_param) < s.employee_limit THEN true
      ELSE false
    END
  FROM public.subscriptions s
  WHERE s.company_id = company_id_param
  UNION ALL
  SELECT false  -- Default to false if no subscription found
  LIMIT 1;
$$;
