-- Add worker_type column to weekly_timesheets table for manual entries
ALTER TABLE public.weekly_timesheets 
ADD COLUMN worker_type text DEFAULT 'subcontractor' CHECK (worker_type IN ('employee', 'subcontractor'));