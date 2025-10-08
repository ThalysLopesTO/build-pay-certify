-- Add foreign key constraint from daily_report_comments.user_id to user_profiles.user_id
-- This enables the Supabase client syntax: user_profiles:user_id (...) to work correctly
ALTER TABLE public.daily_report_comments
ADD CONSTRAINT daily_report_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE CASCADE;

-- Add index for performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_daily_report_comments_user_id 
ON public.daily_report_comments(user_id);