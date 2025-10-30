-- Step 1: Drop the existing check constraint first
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS valid_plan_check;

-- Step 2: Add plan_features column to store feature flags
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS plan_features JSONB DEFAULT '{
  "billsExpenses": true,
  "materialRequests": true,
  "personalSupport": false,
  "customSupport": false
}'::jsonb;

-- Step 3: Migrate any existing 'starter' plans to 'start'
UPDATE public.companies
SET plan = 'start'
WHERE plan = 'starter';

-- Step 4: Set plan_features for existing companies based on their current plan
UPDATE public.companies
SET plan_features = CASE
  WHEN plan = 'free' THEN '{
    "billsExpenses": false,
    "materialRequests": false,
    "personalSupport": false,
    "customSupport": false
  }'::jsonb
  WHEN plan = 'pro' OR plan = 'enterprise' THEN '{
    "billsExpenses": true,
    "materialRequests": true,
    "personalSupport": true,
    "customSupport": true
  }'::jsonb
  WHEN plan = 'start' THEN '{
    "billsExpenses": false,
    "materialRequests": false,
    "personalSupport": false,
    "customSupport": false
  }'::jsonb
  ELSE '{
    "billsExpenses": true,
    "materialRequests": true,
    "personalSupport": false,
    "customSupport": false
  }'::jsonb
END
WHERE plan_features IS NULL;

-- Step 5: Migrate existing $297 'pro' customers to Builder Pro
UPDATE public.companies
SET 
  plan = 'builder_pro',
  employee_limit = 50,
  plan_features = '{
    "billsExpenses": true,
    "materialRequests": true,
    "personalSupport": true,
    "customSupport": true
  }'::jsonb
WHERE plan = 'pro' 
  AND stripe_subscription_id IS NOT NULL
  AND subscription_status IN ('active', 'trialing');

-- Step 6: Update employee_limit default to 5 (Start plan)
ALTER TABLE public.companies 
ALTER COLUMN employee_limit SET DEFAULT 5;

-- Step 7: Update plan column comment
COMMENT ON COLUMN public.companies.plan IS 'Plan tier: start, builder, builder_pro, pro (legacy), free';

-- Step 8: Add new check constraint with new plan values
ALTER TABLE public.companies 
ADD CONSTRAINT valid_plan_check 
CHECK (plan IN ('free', 'pro', 'enterprise', 'start', 'builder', 'builder_pro'));