
-- Create audit_logs table to track punch edits
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edited_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  employee_id UUID REFERENCES auth.users(id) NOT NULL,
  timesheet_id UUID REFERENCES public.timesheets(id) NOT NULL,
  original_clock_in TIMESTAMP WITH TIME ZONE,
  original_clock_out TIMESTAMP WITH TIME ZONE,
  new_clock_in TIMESTAMP WITH TIME ZONE,
  new_clock_out TIMESTAMP WITH TIME ZONE,
  original_jobsite_id UUID,
  new_jobsite_id UUID,
  note TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs - only admins/foremen can view and create
CREATE POLICY "Admins and foremen can view audit logs for their company" 
  ON public.audit_logs 
  FOR SELECT 
  USING (
    company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'foreman')
    )
  );

CREATE POLICY "Admins and foremen can create audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (
    edited_by_user_id = auth.uid() 
    AND company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'foreman')
    )
  );

-- Update timesheets table RLS policy to allow admins/foremen to update punch records
CREATE POLICY "Admins and foremen can update employee timesheets" 
  ON public.timesheets 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'foreman') 
      AND user_profiles.company_id = timesheets.company_id
    )
  );
