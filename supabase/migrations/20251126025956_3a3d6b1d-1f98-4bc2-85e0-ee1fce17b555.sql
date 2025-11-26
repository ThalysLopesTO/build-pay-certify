-- Add break_minutes and admin_note columns to timesheets table for admin overrides
ALTER TABLE timesheets 
ADD COLUMN break_minutes integer DEFAULT NULL,
ADD COLUMN admin_note text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN timesheets.break_minutes IS 'Admin override for break minutes, uses time rule default if null';
COMMENT ON COLUMN timesheets.admin_note IS 'Admin note explaining why time entry was edited';