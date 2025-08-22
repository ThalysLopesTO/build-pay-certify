-- Update existing weekly timesheets with incorrect week_start_date for Thursday week endings
-- For companies with week_ending_day = 4 (Thursday), weeks should start on Friday
UPDATE public.weekly_timesheets 
SET week_start_date = '2025-08-08'::date
WHERE week_start_date = '2025-08-07'::date
AND company_id IN (
  SELECT company_id 
  FROM public.company_settings 
  WHERE week_ending_day = 4
);