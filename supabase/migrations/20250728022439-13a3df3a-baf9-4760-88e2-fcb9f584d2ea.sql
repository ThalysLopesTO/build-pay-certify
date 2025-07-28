-- Add foreign key relationship between missed_punch_requests and jobsites
ALTER TABLE public.missed_punch_requests 
ADD CONSTRAINT fk_missed_punch_requests_jobsite 
FOREIGN KEY (jobsite_id) REFERENCES public.jobsites(id) ON DELETE CASCADE;