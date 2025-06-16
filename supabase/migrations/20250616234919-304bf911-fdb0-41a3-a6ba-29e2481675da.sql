
-- Add company_rules_text field to companies table
ALTER TABLE public.companies 
ADD COLUMN company_rules_text TEXT;

-- Add updated_at trigger for when rules are modified
ALTER TABLE public.companies 
ADD COLUMN rules_updated_at TIMESTAMP WITH TIME ZONE;
