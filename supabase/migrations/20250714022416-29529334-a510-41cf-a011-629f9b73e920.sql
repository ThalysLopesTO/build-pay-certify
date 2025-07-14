-- Add tax percentage to company settings
ALTER TABLE public.company_settings 
ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 13.00;