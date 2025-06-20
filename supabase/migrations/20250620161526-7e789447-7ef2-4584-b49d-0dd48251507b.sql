
-- Drop the existing plan constraint
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS companies_plan_check;

-- Add employee_limit column to companies table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'employee_limit') THEN
        ALTER TABLE public.companies ADD COLUMN employee_limit INTEGER;
    END IF;
END $$;

-- Update existing companies with default values based on their current plan
UPDATE public.companies 
SET employee_limit = CASE 
  WHEN plan = 'starter' THEN 5
  WHEN plan = 'pro' THEN 100
  WHEN plan = 'enterprise' THEN 99999
  WHEN plan = 'free' OR plan IS NULL THEN 5
  ELSE 5
END
WHERE employee_limit IS NULL;

-- Update existing 'free' plans to 'starter'
UPDATE public.companies 
SET plan = 'starter' 
WHERE plan = 'free' OR plan IS NULL;

-- Set default value for employee_limit
ALTER TABLE public.companies 
ALTER COLUMN employee_limit SET DEFAULT 5;

-- Add constraint to ensure valid plan values (including 'free' for backward compatibility)
ALTER TABLE public.companies 
ADD CONSTRAINT valid_plan_check 
CHECK (plan IN ('starter', 'pro', 'enterprise', 'free'));

-- Add constraint to ensure employee_limit is positive
ALTER TABLE public.companies 
ADD CONSTRAINT positive_employee_limit_check 
CHECK (employee_limit > 0);

-- Create a function to get current employee count for a company
CREATE OR REPLACE FUNCTION public.get_company_employee_count(company_id_param UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_profiles 
  WHERE company_id = company_id_param 
  AND role IN ('employee', 'foreman', 'admin', 'payroll');
$$;

-- Create a function to check if company can add more employees
CREATE OR REPLACE FUNCTION public.can_add_employee(company_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN c.employee_limit IS NULL THEN true
      WHEN public.get_company_employee_count(company_id_param) < c.employee_limit THEN true
      ELSE false
    END
  FROM public.companies c
  WHERE c.id = company_id_param;
$$;
