-- Temporarily disable the unique constraint that's causing issues with manual entries
-- We'll replace it with a more flexible constraint that accounts for manual entries

-- First, drop the existing unique constraint
ALTER TABLE public.weekly_timesheets 
DROP CONSTRAINT IF EXISTS weekly_timesheets_submitted_by_jobsite_id_week_start_date_key;

-- Create a new unique constraint that excludes manual entries
-- This allows multiple manual entries for the same jobsite/week while maintaining uniqueness for regular timesheets
CREATE UNIQUE INDEX weekly_timesheets_unique_regular_entries 
ON public.weekly_timesheets (submitted_by, jobsite_id, week_start_date) 
WHERE is_manual_entry IS FALSE OR is_manual_entry IS NULL;

-- For manual entries, we'll ensure uniqueness based on the manual entry name instead
CREATE UNIQUE INDEX weekly_timesheets_unique_manual_entries 
ON public.weekly_timesheets (manual_entry_name, jobsite_id, week_start_date, company_id) 
WHERE is_manual_entry IS TRUE;