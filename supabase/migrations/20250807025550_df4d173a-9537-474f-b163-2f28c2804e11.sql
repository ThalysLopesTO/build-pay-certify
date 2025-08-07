-- Add foreman assignment to jobsites table
ALTER TABLE public.jobsites ADD COLUMN assigned_foreman_id UUID REFERENCES auth.users(id);

-- Create index for better performance when filtering by foreman
CREATE INDEX idx_jobsites_assigned_foreman ON public.jobsites(assigned_foreman_id);

-- Add comment to explain the column
COMMENT ON COLUMN public.jobsites.assigned_foreman_id IS 'UUID of the foreman assigned to this jobsite';

-- Update RLS policy to allow foremen to view their assigned jobsites
CREATE POLICY "Foremen can view their assigned jobsites" 
ON public.jobsites 
FOR SELECT 
USING (
  assigned_foreman_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'foreman'
  )
);

-- Allow foremen to update tasks for their assigned jobsites
CREATE POLICY "Foremen can manage tasks for their assigned jobsites" 
ON public.jobsite_tasks 
FOR ALL 
USING (
  jobsite_id IN (
    SELECT id FROM public.jobsites 
    WHERE assigned_foreman_id = auth.uid()
  )
)
WITH CHECK (
  jobsite_id IN (
    SELECT id FROM public.jobsites 
    WHERE assigned_foreman_id = auth.uid()
  )
);