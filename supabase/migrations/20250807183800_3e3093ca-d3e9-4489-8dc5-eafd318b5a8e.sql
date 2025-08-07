-- Add timesheet_frequency to company_settings for weekly/bi-weekly support
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS timesheet_frequency text NOT NULL DEFAULT 'weekly' CHECK (timesheet_frequency IN ('weekly','bi-weekly'));

COMMENT ON COLUMN public.company_settings.timesheet_frequency IS 'Timesheet period frequency: weekly or bi-weekly';