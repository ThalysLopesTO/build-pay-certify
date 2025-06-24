
-- Add week_ending_day column to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN week_ending_day INTEGER DEFAULT 0 CHECK (week_ending_day >= 0 AND week_ending_day <= 6);

-- Add comment to explain the values
COMMENT ON COLUMN public.company_settings.week_ending_day IS 'Day of week when work week ends: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
