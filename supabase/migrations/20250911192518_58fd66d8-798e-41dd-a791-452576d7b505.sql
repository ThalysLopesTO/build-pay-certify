-- Add daily_report to notification type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'daily_report';

-- Create function to notify when new daily report is submitted
CREATE OR REPLACE FUNCTION public.notify_new_daily_report()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  employee_name text;
  jobsite_name text;
BEGIN
  -- Get the employee's full name
  SELECT CONCAT(up.first_name, ' ', up.last_name)
  INTO employee_name
  FROM user_profiles up
  WHERE up.user_id = NEW.submitted_by;
  
  -- Get jobsite name for description
  SELECT name INTO jobsite_name FROM jobsites WHERE id = NEW.jobsite_id;
  
  -- Insert notification for admins
  INSERT INTO public.notifications (
    company_id, 
    title, 
    description, 
    type, 
    related_id, 
    user_role,
    redirect_to
  )
  VALUES (
    NEW.company_id,
    COALESCE(employee_name, 'Employee') || ' – New Daily Report',
    'A new daily report has been submitted for ' || COALESCE(jobsite_name, 'Unknown Jobsite'),
    'daily_report',
    NEW.id,
    'admin',
    '/admin/daily-reports'
  );
  
  -- Insert notification for management
  INSERT INTO public.notifications (
    company_id, 
    title, 
    description, 
    type, 
    related_id, 
    user_role,
    redirect_to
  )
  VALUES (
    NEW.company_id,
    COALESCE(employee_name, 'Employee') || ' – New Daily Report',
    'A new daily report has been submitted for ' || COALESCE(jobsite_name, 'Unknown Jobsite'),
    'daily_report',
    NEW.id,
    'management',
    '/admin/daily-reports'
  );
  
  -- Insert notification for foremen
  INSERT INTO public.notifications (
    company_id, 
    title, 
    description, 
    type, 
    related_id, 
    user_role,
    redirect_to
  )
  VALUES (
    NEW.company_id,
    COALESCE(employee_name, 'Employee') || ' – New Daily Report',
    'A new daily report has been submitted for ' || COALESCE(jobsite_name, 'Unknown Jobsite'),
    'daily_report',
    NEW.id,
    'foreman',
    '/admin/daily-reports'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically notify when daily report is inserted
CREATE OR REPLACE TRIGGER notify_daily_report_submission
  AFTER INSERT ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_daily_report();