-- Add tax_included field to weekly_timesheets table to track employee tax preference
ALTER TABLE public.weekly_timesheets 
ADD COLUMN IF NOT EXISTS tax_included boolean DEFAULT false;

-- Add calculated_tax field to store the actual tax amount when included
ALTER TABLE public.weekly_timesheets 
ADD COLUMN IF NOT EXISTS calculated_tax numeric DEFAULT 0;