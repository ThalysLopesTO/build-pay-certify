-- Add worker_type column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN worker_type text DEFAULT 'subcontractor' CHECK (worker_type IN ('employee', 'subcontractor'));