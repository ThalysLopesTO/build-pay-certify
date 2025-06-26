
-- Update companies table to include plan information
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date DATE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update employee_limit based on plan_type if not already set
UPDATE public.companies 
SET employee_limit = CASE 
  WHEN plan_type = 'basic' THEN 10
  WHEN plan_type = 'premium' THEN 20
  WHEN plan_type = 'enterprise' THEN NULL
  ELSE 10
END
WHERE employee_limit IS NULL OR employee_limit = 5;

-- Add constraint for valid plan types
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS valid_plan_type_check;

ALTER TABLE public.companies 
ADD CONSTRAINT valid_plan_type_check 
CHECK (plan_type IN ('basic', 'premium', 'enterprise'));

-- Add constraint for valid subscription status
ALTER TABLE public.companies 
ADD CONSTRAINT valid_subscription_status_check 
CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled'));

-- Create a table for plan definitions
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  employee_limit INTEGER,
  stripe_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (plan_type, name, price_monthly, employee_limit, features) VALUES
('basic', 'Basic Plan', 49.90, 10, '["Up to 10 employees", "Basic payroll features", "Standard support"]'::jsonb),
('premium', 'Premium Plan', 89.90, 20, '["Up to 20 employees", "Advanced payroll features", "Priority support", "Advanced reporting"]'::jsonb),
('enterprise', 'Enterprise Plan', NULL, NULL, '["Unlimited employees", "Custom features", "Dedicated support", "API access"]'::jsonb)
ON CONFLICT (plan_type) DO NOTHING;

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for reading subscription plans (everyone can see available plans)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Update the existing employee limit function to work with new plan system
CREATE OR REPLACE FUNCTION public.can_add_employee(company_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN c.employee_limit IS NULL THEN true  -- Enterprise plan
      WHEN c.subscription_status != 'active' THEN false  -- Inactive subscription
      WHEN public.get_company_employee_count(company_id_param) < c.employee_limit THEN true
      ELSE false
    END
  FROM public.companies c
  WHERE c.id = company_id_param;
$$;

-- Create function to get company plan details
CREATE OR REPLACE FUNCTION public.get_company_plan_details(company_id_param UUID)
RETURNS TABLE(
  plan_type TEXT,
  plan_name TEXT,
  price_monthly DECIMAL,
  employee_limit INTEGER,
  current_employee_count INTEGER,
  subscription_status TEXT,
  subscription_end_date DATE,
  can_add_employees BOOLEAN
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    c.plan_type,
    sp.name,
    sp.price_monthly,
    c.employee_limit,
    public.get_company_employee_count(company_id_param),
    c.subscription_status,
    c.subscription_end_date,
    public.can_add_employee(company_id_param)
  FROM public.companies c
  LEFT JOIN public.subscription_plans sp ON c.plan_type = sp.plan_type
  WHERE c.id = company_id_param;
$$;
