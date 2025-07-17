-- Add default tax/deduction rates for payroll employees
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS income_tax_rate NUMERIC(5,2) DEFAULT 12.00,
ADD COLUMN IF NOT EXISTS cpp_rate NUMERIC(5,2) DEFAULT 5.95,
ADD COLUMN IF NOT EXISTS ei_rate NUMERIC(5,2) DEFAULT 1.63;

-- Update weekly_timesheets to store more employee data for better preservation (only add missing columns)
ALTER TABLE public.weekly_timesheets 
ADD COLUMN IF NOT EXISTS income_tax_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS cpp_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS ei_rate NUMERIC(5,2);

-- Migrate existing timesheet data to include worker_type and tax rates from user_profiles where missing
UPDATE public.weekly_timesheets 
SET income_tax_rate = COALESCE(weekly_timesheets.income_tax_rate, up.income_tax_rate, 12.00),
    cpp_rate = COALESCE(weekly_timesheets.cpp_rate, up.cpp_rate, 5.95),
    ei_rate = COALESCE(weekly_timesheets.ei_rate, up.ei_rate, 1.63)
FROM public.user_profiles up 
WHERE weekly_timesheets.submitted_by = up.user_id
AND (weekly_timesheets.income_tax_rate IS NULL OR weekly_timesheets.cpp_rate IS NULL OR weekly_timesheets.ei_rate IS NULL);