-- Fix notify_new_daily_report function to use correct redirect URLs
CREATE OR REPLACE FUNCTION public.notify_new_daily_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    '/admin/dashboard?tab=daily-reports'
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
    '/management/dashboard?tab=daily-reports'
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
    '/foreman/dashboard?tab=daily-reports'
  );
  
  RETURN NEW;
END;
$function$;

-- Update existing daily report notifications with incorrect redirect_to values
UPDATE public.notifications
SET redirect_to = CASE 
  WHEN user_role = 'admin' THEN '/admin/dashboard?tab=daily-reports'
  WHEN user_role = 'management' THEN '/management/dashboard?tab=daily-reports'
  WHEN user_role = 'foreman' THEN '/foreman/dashboard?tab=daily-reports'
  ELSE redirect_to
END
WHERE type = 'daily_report' 
  AND (redirect_to = '/admin/daily-reports' OR redirect_to IS NULL OR redirect_to = '');