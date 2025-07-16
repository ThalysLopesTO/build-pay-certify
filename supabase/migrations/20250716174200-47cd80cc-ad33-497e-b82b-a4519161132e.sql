-- Add employee_name column to weekly_timesheets table
ALTER TABLE public.weekly_timesheets ADD COLUMN employee_name TEXT;

-- Migrate existing data: populate employee_name from user_profiles for active users
UPDATE public.weekly_timesheets 
SET employee_name = CONCAT(up.first_name, ' ', up.last_name)
FROM public.user_profiles up
WHERE weekly_timesheets.submitted_by = up.user_id 
AND weekly_timesheets.employee_name IS NULL;

-- For records where submitted_by is null but we don't have a name, we'll leave it null
-- The UI will handle the fallback display