-- Add unique constraint on company_id to allow proper upsert operations
ALTER TABLE public.company_settings 
ADD CONSTRAINT company_settings_company_id_unique UNIQUE (company_id);