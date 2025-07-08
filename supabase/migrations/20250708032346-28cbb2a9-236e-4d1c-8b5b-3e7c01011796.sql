-- First, drop the existing check constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Update existing payroll users to management
UPDATE public.user_profiles 
SET role = 'management' 
WHERE role = 'payroll';

-- Create a new check constraint that includes management but excludes payroll
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'foreman', 'management', 'account', 'employee'));