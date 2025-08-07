-- Create join table for multiple foremen per jobsite
CREATE TABLE public.jobsite_foremen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  foreman_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate assignments
  UNIQUE(jobsite_id, foreman_id)
);

-- Enable RLS
ALTER TABLE public.jobsite_foremen ENABLE ROW LEVEL SECURITY;

-- Policy: Admins/Managers can manage foreman assignments
CREATE POLICY "Admins and managers can manage foreman assignments" 
ON public.jobsite_foremen 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = (
      SELECT company_id FROM public.jobsites 
      WHERE id = jobsite_foremen.jobsite_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = (
      SELECT company_id FROM public.jobsites 
      WHERE id = jobsite_foremen.jobsite_id
    )
  )
);

-- Policy: Foremen can view their assigned jobsite links
CREATE POLICY "Foremen can view their assignments" 
ON public.jobsite_foremen 
FOR SELECT 
USING (foreman_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_jobsite_foremen_jobsite_id ON public.jobsite_foremen(jobsite_id);
CREATE INDEX idx_jobsite_foremen_foreman_id ON public.jobsite_foremen(foreman_id);