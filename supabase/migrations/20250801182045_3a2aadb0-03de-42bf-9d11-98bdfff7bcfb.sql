-- Fix the foreign key relationship between daily_reports and user_profiles
-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_submitted_by_fkey;

-- Add the correct foreign key constraint to link daily_reports.submitted_by to user_profiles.user_id
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES user_profiles(user_id) ON DELETE CASCADE;