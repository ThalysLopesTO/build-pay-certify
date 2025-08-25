-- Fix Gabriel's timesheet and other bi-weekly timesheets with incorrect start dates
-- Update week_start_date from Aug 07 to Aug 08 for Thursday week-ending companies

-- First, fix the specific Gabriel timesheet mentioned by the user
UPDATE weekly_timesheets 
SET week_start_date = '2024-08-08'
WHERE week_start_date = '2024-08-07' 
AND company_id IN (
  SELECT company_id FROM company_settings 
  WHERE week_ending_day = 4 -- Thursday
  AND timesheet_frequency = 'bi-weekly'
);

-- Fix all bi-weekly timesheets that have incorrect start dates for Thursday week-ending companies
-- For bi-weekly periods ending on Thursday, the start should be Friday 13 days before
UPDATE weekly_timesheets 
SET week_start_date = (
  -- Calculate correct start date: find the Thursday (week_end), then subtract 13 days to get Friday start
  week_start_date + INTERVAL '6 days' + 
  (4 - EXTRACT(DOW FROM week_start_date + INTERVAL '6 days'))::int * INTERVAL '1 day' - 
  INTERVAL '13 days'
)
WHERE company_id IN (
  SELECT company_id FROM company_settings 
  WHERE week_ending_day = 4 -- Thursday
  AND timesheet_frequency = 'bi-weekly'
)
AND week_start_date != (
  week_start_date + INTERVAL '6 days' + 
  (4 - EXTRACT(DOW FROM week_start_date + INTERVAL '6 days'))::int * INTERVAL '1 day' - 
  INTERVAL '13 days'
);

-- Generate missing bi-weekly JSON for timesheets that should have it but don't
UPDATE weekly_timesheets 
SET notes = COALESCE(notes, '') || E'\n__biweekly_json__=' || encode(
  jsonb_build_object(
    'days', jsonb_build_array(
      jsonb_build_object('date', week_start_date, 'hours', COALESCE(monday_hours, 0)),
      jsonb_build_object('date', week_start_date + 1, 'hours', COALESCE(tuesday_hours, 0)),
      jsonb_build_object('date', week_start_date + 2, 'hours', COALESCE(wednesday_hours, 0)),
      jsonb_build_object('date', week_start_date + 3, 'hours', COALESCE(thursday_hours, 0)),
      jsonb_build_object('date', week_start_date + 4, 'hours', COALESCE(friday_hours, 0)),
      jsonb_build_object('date', week_start_date + 5, 'hours', COALESCE(saturday_hours, 0)),
      jsonb_build_object('date', week_start_date + 6, 'hours', COALESCE(sunday_hours, 0)),
      jsonb_build_object('date', week_start_date + 7, 'hours', 0),
      jsonb_build_object('date', week_start_date + 8, 'hours', 0),
      jsonb_build_object('date', week_start_date + 9, 'hours', 0),
      jsonb_build_object('date', week_start_date + 10, 'hours', 0),
      jsonb_build_object('date', week_start_date + 11, 'hours', 0),
      jsonb_build_object('date', week_start_date + 12, 'hours', 0),
      jsonb_build_object('date', week_start_date + 13, 'hours', 0)
    )
  )::text, 'base64'
) || E'__end_biweekly_json__'
WHERE company_id IN (
  SELECT company_id FROM company_settings 
  WHERE timesheet_frequency = 'bi-weekly'
)
AND (notes IS NULL OR notes NOT LIKE '%__biweekly_json__%');