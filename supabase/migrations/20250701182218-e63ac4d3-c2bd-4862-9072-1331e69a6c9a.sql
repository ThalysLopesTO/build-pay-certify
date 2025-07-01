
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('certificate', 'jobsite', 'material_request', 'attention_report')),
  related_id UUID, -- References the related item (certificate_id, jobsite_id, etc.)
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'foreman')),
  target_user_id UUID, -- Optional: specific user to notify
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to see all company notifications
CREATE POLICY "Admins can view company notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (
    company_id = get_user_company_id() 
    AND (user_role = 'admin' OR user_role = 'foreman')
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'foreman')
      AND user_profiles.company_id = notifications.company_id
    )
  );

-- Policy for updating notifications (mark as read/dismissed)
CREATE POLICY "Users can update notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    company_id = get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'foreman')
      AND user_profiles.company_id = notifications.company_id
    )
  );

-- Policy for deleting notifications
CREATE POLICY "Users can delete notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (
    company_id = get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'foreman')
      AND user_profiles.company_id = notifications.company_id
    )
  );

-- Function to auto-generate certificate expiration notifications
CREATE OR REPLACE FUNCTION public.check_expiring_certificates()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for certificates expiring within 30 days
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role)
  SELECT DISTINCT
    ec.company_id,
    'Certificate Expiring Soon',
    'Certificate "' || ec.certificate_name || '" for employee expires on ' || ec.expiry_date::text,
    'certificate',
    ec.id,
    'admin'
  FROM employee_certificates ec
  LEFT JOIN notifications n ON (
    n.related_id = ec.id 
    AND n.type = 'certificate' 
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days' -- Don't create duplicate notifications within 7 days
  )
  WHERE ec.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND ec.expiry_date > CURRENT_DATE
    AND n.id IS NULL; -- Only create if notification doesn't already exist
END;
$$;

-- Function to auto-generate overdue jobsite notifications
CREATE OR REPLACE FUNCTION public.check_overdue_jobsites()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for overdue jobsites (assuming there's a due_date field)
  -- Note: Current jobsites table doesn't have due_date, so we'll add it
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role)
  SELECT DISTINCT
    j.company_id,
    'Project Overdue',
    'Jobsite "' || j.name || '" is past its due date',
    'jobsite',
    j.id,
    'admin'
  FROM jobsites j
  LEFT JOIN notifications n ON (
    n.related_id = j.id 
    AND n.type = 'jobsite' 
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE j.due_date < CURRENT_DATE
    AND n.id IS NULL;
END;
$$;

-- Add due_date column to jobsites table
ALTER TABLE public.jobsites 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Function to create notification for new material requests
CREATE OR REPLACE FUNCTION public.notify_new_material_request()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role)
  VALUES (
    NEW.company_id,
    'New Material Request',
    'A new material request has been submitted for ' || (SELECT name FROM jobsites WHERE id = NEW.jobsite_id),
    'material_request',
    NEW.id,
    'admin'
  );
  RETURN NEW;
END;
$$;

-- Function to create notification for new attention reports
CREATE OR REPLACE FUNCTION public.notify_new_attention_report()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role)
  VALUES (
    NEW.company_id,
    'New Attention Report',
    'A new attention report has been submitted',
    'attention_report',
    NEW.id,
    'admin'
  );
  
  -- Also notify foremen
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role)
  VALUES (
    NEW.company_id,
    'New Attention Report',
    'A new attention report has been submitted',
    'attention_report',
    NEW.id,
    'foreman'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers for auto-notifications
CREATE TRIGGER trigger_notify_material_request
  AFTER INSERT ON material_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_material_request();

CREATE TRIGGER trigger_notify_attention_report
  AFTER INSERT ON attention_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_attention_report();

-- Function to clean up old notifications (15+ days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '15 days'
    AND (is_dismissed = true OR is_read = true);
END;
$$;
