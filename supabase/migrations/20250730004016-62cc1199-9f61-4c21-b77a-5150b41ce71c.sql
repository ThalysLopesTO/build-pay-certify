-- Add foreign key relationship between missed_punch_requests and user_profiles
ALTER TABLE public.missed_punch_requests 
ADD CONSTRAINT fk_missed_punch_requests_employee 
FOREIGN KEY (employee_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;