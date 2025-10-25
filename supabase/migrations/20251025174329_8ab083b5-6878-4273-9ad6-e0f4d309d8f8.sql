-- Make company_id nullable in user_profiles to allow super admins without company association
ALTER TABLE user_profiles ALTER COLUMN company_id DROP NOT NULL;

-- Update comment for clarity
COMMENT ON COLUMN user_profiles.company_id IS 'Company ID - nullable for super admins who manage the platform without belonging to a specific company';