-- Add foreign key relationships for daily_reports table
ALTER TABLE public.daily_reports 
ADD CONSTRAINT daily_reports_jobsite_id_fkey 
FOREIGN KEY (jobsite_id) REFERENCES public.jobsites(id) ON DELETE CASCADE;

ALTER TABLE public.daily_reports 
ADD CONSTRAINT daily_reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.daily_reports 
ADD CONSTRAINT daily_reports_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;