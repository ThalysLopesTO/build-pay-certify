-- Remove default value from hourly_rate column in user_profiles table
ALTER TABLE public.user_profiles ALTER COLUMN hourly_rate DROP DEFAULT;