
-- Create table for jobsite tasks/phases
CREATE TABLE public.jobsite_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  task_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for jobsite tasks
ALTER TABLE public.jobsite_tasks ENABLE ROW LEVEL SECURITY;

-- Policy for admins and foremen to view tasks in their company
CREATE POLICY "Users can view jobsite tasks in their company" 
  ON public.jobsite_tasks 
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for admins to insert tasks
CREATE POLICY "Admins can create jobsite tasks" 
  ON public.jobsite_tasks 
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy for admins to update tasks
CREATE POLICY "Admins can update jobsite tasks" 
  ON public.jobsite_tasks 
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy for admins to delete tasks
CREATE POLICY "Admins can delete jobsite tasks" 
  ON public.jobsite_tasks 
  FOR DELETE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_jobsite_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_jobsite_tasks_updated_at
  BEFORE UPDATE ON public.jobsite_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_jobsite_tasks_updated_at();
