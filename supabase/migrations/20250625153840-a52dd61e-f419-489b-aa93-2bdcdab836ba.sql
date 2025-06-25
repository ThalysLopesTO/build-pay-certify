
-- Create timesheets table for mobile clock in/out
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_location TEXT,
  check_out_location TEXT,
  hours_worked NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL REFERENCES public.companies(id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Employees can only see their own timesheets
CREATE POLICY "Employees can view their own timesheets" 
  ON public.timesheets 
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'foreman', 'super_admin')
      AND company_id = timesheets.company_id
    )
  );

-- Employees can insert their own timesheets
CREATE POLICY "Employees can create their own timesheets" 
  ON public.timesheets 
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Employees can update their own pending timesheets, admins/foremen can update any
CREATE POLICY "Users can update timesheets based on role" 
  ON public.timesheets 
  FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'foreman', 'super_admin')
      AND company_id = timesheets.company_id
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX idx_timesheets_jobsite_id ON public.timesheets(jobsite_id);
CREATE INDEX idx_timesheets_company_id ON public.timesheets(company_id);
CREATE INDEX idx_timesheets_check_in_time ON public.timesheets(check_in_time);
CREATE INDEX idx_timesheets_status ON public.timesheets(status);

-- Create trigger to automatically calculate hours worked
CREATE OR REPLACE FUNCTION calculate_hours_worked()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.hours_worked := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600.0;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_hours_worked
  BEFORE INSERT OR UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_hours_worked();
