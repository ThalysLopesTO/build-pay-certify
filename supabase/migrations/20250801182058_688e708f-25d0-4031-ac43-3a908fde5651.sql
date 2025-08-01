-- Fix foreign key constraint for daily_reports.submitted_by
-- Drop the incorrect foreign key constraint
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_submitted_by_fkey;

-- Add correct foreign key constraint to user_profiles
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES user_profiles(user_id);