
-- Add redirect_to field to notifications table for dynamic redirection
ALTER TABLE public.notifications 
ADD COLUMN redirect_to text;

-- Update the notify_new_attention_report function to include employee name and redirect URL
CREATE OR REPLACE FUNCTION public.notify_new_attention_report()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  employee_name text;
BEGIN
  -- Get the employee's full name
  SELECT CONCAT(up.first_name, ' ', up.last_name)
  INTO employee_name
  FROM user_profiles up
  WHERE up.user_id = NEW.submitted_by;
  
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
    COALESCE(employee_name, 'Employee') || ' – New Attention Report',
    'A new attention report has been submitted',
    'attention_report',
    NEW.id,
    'admin',
    '/admin/attention-reports/' || NEW.id
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
    COALESCE(employee_name, 'Employee') || ' – New Attention Report',
    'A new attention report has been submitted',
    'attention_report',
    NEW.id,
    'foreman',
    '/admin/attention-reports/' || NEW.id
  );
  
  RETURN NEW;
END;
$function$;

-- Update the notify_new_material_request function to include employee name and redirect URL
CREATE OR REPLACE FUNCTION public.notify_new_material_request()
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
    COALESCE(employee_name, 'Employee') || ' – New Material Request',
    'A new material request has been submitted for ' || COALESCE(jobsite_name, 'Unknown Jobsite'),
    'material_request',
    NEW.id,
    'admin',
    '/admin/material-requests/' || NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Update check_expiring_certificates function to include redirect URLs
CREATE OR REPLACE FUNCTION public.check_expiring_certificates()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert notifications for certificates expiring within 30 days
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    ec.company_id,
    'Certificate Expiring Soon',
    'Certificate "' || ec.certificate_name || '" for employee expires on ' || ec.expiry_date::text,
    'certificate',
    ec.id,
    'admin',
    '/admin/employee-management/' || ec.employee_id || '#certificates'
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
$function$;

-- Update check_overdue_jobsites function to include redirect URLs
CREATE OR REPLACE FUNCTION public.check_overdue_jobsites()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert notifications for overdue jobsites
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    j.company_id,
    'Project Overdue',
    'Jobsite "' || j.name || '" is past its due date',
    'jobsite',
    j.id,
    'admin',
    '/admin/jobsite-management/' || j.id
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
$function$;
