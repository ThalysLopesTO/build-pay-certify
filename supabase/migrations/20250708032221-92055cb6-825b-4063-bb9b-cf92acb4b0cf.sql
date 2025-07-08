-- Update the role enum to rename 'payroll' to 'management'
-- First, update any existing user profiles with the payroll role
UPDATE public.user_profiles 
SET role = 'management' 
WHERE role = 'payroll';

-- Add the new 'management' role to existing enum (PostgreSQL doesn't allow direct rename)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'management';

-- Note: We cannot remove 'payroll' from the enum directly without recreating it
-- But since we've updated all existing records, the old value won't be used