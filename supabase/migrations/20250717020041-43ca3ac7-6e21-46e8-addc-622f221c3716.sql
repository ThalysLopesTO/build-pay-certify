-- Add status column to jobsites table
ALTER TABLE public.jobsites 
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Add check constraint to ensure valid status values
ALTER TABLE public.jobsites 
ADD CONSTRAINT jobsites_status_check 
CHECK (status IN ('active', 'completed', 'archived'));

-- Add index for better performance when filtering by status
CREATE INDEX idx_jobsites_status ON public.jobsites(status);

-- Add completion_date column to track when jobsite was completed
ALTER TABLE public.jobsites 
ADD COLUMN completion_date date;