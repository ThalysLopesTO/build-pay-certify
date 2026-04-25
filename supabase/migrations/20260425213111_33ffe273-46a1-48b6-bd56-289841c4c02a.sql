ALTER TABLE public.manual_timesheets
  ADD COLUMN IF NOT EXISTS tax_percent numeric(5,2) NOT NULL DEFAULT 0;