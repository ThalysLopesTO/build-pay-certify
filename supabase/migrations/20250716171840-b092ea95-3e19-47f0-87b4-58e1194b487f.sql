-- Make submitted_by column nullable in weekly_timesheets table
-- This allows ON DELETE SET NULL to work properly when deleting employees

ALTER TABLE public.weekly_timesheets 
ALTER COLUMN submitted_by DROP NOT NULL;