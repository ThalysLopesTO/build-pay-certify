-- Fix foreign key constraints for daily_reports table
-- Drop existing constraints if they exist
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_jobsite_id_fkey;
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_submitted_by_fkey;
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_company_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_jobsite_id_fkey 
FOREIGN KEY (jobsite_id) REFERENCES jobsites(id);

ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES auth.users(id);

ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);