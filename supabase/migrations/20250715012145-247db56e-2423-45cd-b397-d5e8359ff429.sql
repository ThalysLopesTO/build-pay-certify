-- Add field to identify manual timesheet entries
ALTER TABLE public.weekly_timesheets 
ADD COLUMN manual_entry_name TEXT,
ADD COLUMN is_manual_entry BOOLEAN DEFAULT FALSE;

-- Add index for better performance on manual entry queries
CREATE INDEX idx_weekly_timesheets_manual_entry 
ON public.weekly_timesheets(is_manual_entry) 
WHERE is_manual_entry = TRUE;