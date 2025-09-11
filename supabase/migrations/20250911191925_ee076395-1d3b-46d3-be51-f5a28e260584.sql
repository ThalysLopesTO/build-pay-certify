-- Fix existing daily_reports with incorrect report_date due to timezone issues
-- Update report_date to reflect the actual submission date in company timezone

-- Get company timezone settings and fix the dates
UPDATE daily_reports 
SET report_date = DATE(daily_reports.created_at AT TIME ZONE COALESCE(cs.timezone, 'America/Toronto'))
FROM company_settings cs
WHERE daily_reports.company_id = cs.company_id
AND daily_reports.report_date != DATE(daily_reports.created_at AT TIME ZONE COALESCE(cs.timezone, 'America/Toronto'));

-- Also fix any reports where company_settings doesn't exist (use default timezone)
UPDATE daily_reports 
SET report_date = DATE(created_at AT TIME ZONE 'America/Toronto')
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings cs WHERE cs.company_id = daily_reports.company_id
)
AND report_date != DATE(created_at AT TIME ZONE 'America/Toronto');