-- Add columns for custom deduction rates in manual timesheets
ALTER TABLE public.weekly_timesheets 
ADD COLUMN income_tax_rate numeric,
ADD COLUMN cpp_rate numeric,
ADD COLUMN ei_rate numeric;