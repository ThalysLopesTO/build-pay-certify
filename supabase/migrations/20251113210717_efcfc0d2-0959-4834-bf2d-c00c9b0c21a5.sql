-- Add quote expiry reminder settings to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS enable_quote_expiry_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quote_expiry_reminder_days_before INTEGER DEFAULT 3;

COMMENT ON COLUMN public.company_settings.enable_quote_expiry_reminders IS 'Enable automated reminders for quotes approaching expiry date';
COMMENT ON COLUMN public.company_settings.quote_expiry_reminder_days_before IS 'Number of days before quote expiry to send reminder to client';