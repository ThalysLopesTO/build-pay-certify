
-- Create audit table for timesheet edits
CREATE TABLE public.weekly_timesheet_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timesheet_id UUID NOT NULL REFERENCES public.weekly_timesheets(id),
  edited_by_user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for audit logs
ALTER TABLE public.weekly_timesheet_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and foremen can create audit logs for their company
CREATE POLICY "Admins can create weekly timesheet audit logs" 
  ON public.weekly_timesheet_audit_logs 
  FOR INSERT 
  WITH CHECK (
    edited_by_user_id = auth.uid() AND 
    company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'foreman')
    )
  );

-- Admins and foremen can view audit logs for their company
CREATE POLICY "Admins can view weekly timesheet audit logs" 
  ON public.weekly_timesheet_audit_logs 
  FOR SELECT 
  USING (
    company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'foreman')
    )
  );
