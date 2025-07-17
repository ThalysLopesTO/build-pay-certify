-- Add default tax/deduction rates for payroll employees
ALTER TABLE public.user_profiles 
ADD COLUMN income_tax_rate NUMERIC(5,2) DEFAULT 12.00,
ADD COLUMN cpp_rate NUMERIC(5,2) DEFAULT 5.95,
ADD COLUMN ei_rate NUMERIC(5,2) DEFAULT 1.63;

-- Update weekly_timesheets to store more employee data for better preservation
ALTER TABLE public.weekly_timesheets 
ADD COLUMN worker_type TEXT DEFAULT 'subcontractor',
ADD COLUMN income_tax_rate NUMERIC(5,2),
ADD COLUMN cpp_rate NUMERIC(5,2),
ADD COLUMN ei_rate NUMERIC(5,2);

-- Migrate existing timesheet data to include worker_type from user_profiles
UPDATE public.weekly_timesheets 
SET worker_type = COALESCE(up.worker_type, 'subcontractor'),
    income_tax_rate = COALESCE(up.income_tax_rate, 12.00),
    cpp_rate = COALESCE(up.cpp_rate, 5.95),
    ei_rate = COALESCE(up.ei_rate, 1.63)
FROM public.user_profiles up 
WHERE public.weekly_timesheets.submitted_by = up.user_id
AND public.weekly_timesheets.worker_type IS NULL;