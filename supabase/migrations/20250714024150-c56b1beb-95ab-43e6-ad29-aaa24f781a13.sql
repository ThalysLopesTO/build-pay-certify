-- Add show_tax_breakdown_to_employees setting to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS show_tax_breakdown_to_employees boolean DEFAULT true;