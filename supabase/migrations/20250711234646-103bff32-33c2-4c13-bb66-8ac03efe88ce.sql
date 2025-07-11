-- Create password reset logs table for accountability
CREATE TABLE public.password_reset_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_user_email TEXT NOT NULL,
  target_user_name TEXT NOT NULL,
  reset_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for password reset logs
CREATE POLICY "Admins can view password reset logs for their company" ON password_reset_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );

CREATE POLICY "Admins can insert password reset logs" ON password_reset_logs
  FOR INSERT WITH CHECK (
    admin_user_id = auth.uid() AND
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );

-- Add index for performance
CREATE INDEX idx_password_reset_logs_company_id ON password_reset_logs(company_id);
CREATE INDEX idx_password_reset_logs_admin_user_id ON password_reset_logs(admin_user_id);
CREATE INDEX idx_password_reset_logs_target_user_id ON password_reset_logs(target_user_id);