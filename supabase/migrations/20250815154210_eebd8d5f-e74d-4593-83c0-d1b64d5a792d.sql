-- Add admin_password column to company_registration_requests table
ALTER TABLE public.company_registration_requests 
ADD COLUMN admin_password text;