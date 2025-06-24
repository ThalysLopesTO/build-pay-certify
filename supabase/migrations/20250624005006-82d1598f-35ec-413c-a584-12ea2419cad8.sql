
-- Add company_rules_text column to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN company_rules_text TEXT;
