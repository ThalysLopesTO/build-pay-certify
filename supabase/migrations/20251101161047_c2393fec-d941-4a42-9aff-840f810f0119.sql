-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create jobsite_schedule_items table
CREATE TABLE public.jobsite_schedule_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  task_type TEXT NOT NULL DEFAULT 'task' CHECK (task_type IN ('task', 'milestone', 'summary')),
  parent_id UUID REFERENCES public.jobsite_schedule_items(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_jobsite_schedule_items_jobsite_id ON public.jobsite_schedule_items(jobsite_id);
CREATE INDEX idx_jobsite_schedule_items_company_id ON public.jobsite_schedule_items(company_id);
CREATE INDEX idx_jobsite_schedule_items_parent_id ON public.jobsite_schedule_items(parent_id);

-- Enable Row Level Security
ALTER TABLE public.jobsite_schedule_items ENABLE ROW LEVEL SECURITY;

-- Policy: Company users can view schedule items for their company's jobsites
CREATE POLICY "Company users can view schedule items for their company"
ON public.jobsite_schedule_items
FOR SELECT
USING (company_id = get_user_company_id());

-- Policy: Admins and foremen can create schedule items
CREATE POLICY "Admins and foremen can create schedule items"
ON public.jobsite_schedule_items
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = jobsite_schedule_items.company_id
  )
);

-- Policy: Admins and foremen can update schedule items
CREATE POLICY "Admins and foremen can update schedule items"
ON public.jobsite_schedule_items
FOR UPDATE
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = jobsite_schedule_items.company_id
  )
);

-- Policy: Admins and foremen can delete schedule items
CREATE POLICY "Admins and foremen can delete schedule items"
ON public.jobsite_schedule_items
FOR DELETE
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = jobsite_schedule_items.company_id
  )
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_jobsite_schedule_items_updated_at
BEFORE UPDATE ON public.jobsite_schedule_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();