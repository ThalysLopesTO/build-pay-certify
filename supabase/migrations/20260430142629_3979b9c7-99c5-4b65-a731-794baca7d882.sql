ALTER TABLE public.manual_timesheets
  ADD COLUMN IF NOT EXISTS employee_role text,
  ALTER COLUMN employee_id DROP NOT NULL;