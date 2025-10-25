-- Fix existing thalysadmin@gmail.com user to be a proper super admin
UPDATE user_profiles
SET 
  role = 'super_admin',
  company_id = NULL,
  first_name = 'Thalys',
  last_name = 'Lopes',
  updated_at = NOW()
WHERE user_id = 'edbdb6e5-747a-410b-8170-117440b69cf5';