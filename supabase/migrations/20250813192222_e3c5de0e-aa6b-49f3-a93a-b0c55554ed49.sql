-- Update notifications table to support management role
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_role_check;

-- Add new check constraint that includes management role
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_role_check 
CHECK (user_role IN ('admin', 'foreman', 'management'));

-- Update the notification functions to include management role notifications
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
    COALESCE(employee_name, 'Employee') || ' – New Attention Report',
    'A new attention report has been submitted',
    'attention_report',
    NEW.id,
    'management',
    '/management/reports'
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

-- Update notification functions to create management notifications for bills
CREATE OR REPLACE FUNCTION public.check_bills_due_soon()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert notifications for bills due in 3 days
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    be.company_id,
    'Bill Due Soon: ' || be.expense_title,
    'Bill "' || be.expense_title || '" ($' || be.amount || ') from ' || be.vendor_payee || ' is due on ' || be.expense_date::text,
    'bill_due_soon',
    be.id,
    'admin',
    '/admin/bills-expenses/' || be.id
  FROM bills_expenses be
  LEFT JOIN notifications n ON (
    n.related_id = be.id 
    AND n.type = 'bill_due_soon' 
    AND n.user_role = 'admin'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE be.expense_date = CURRENT_DATE + INTERVAL '3 days'
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL;

  -- Insert notifications for management
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    be.company_id,
    'Bill Due Soon: ' || be.expense_title,
    'Bill "' || be.expense_title || '" ($' || be.amount || ') from ' || be.vendor_payee || ' is due on ' || be.expense_date::text,
    'bill_due_soon',
    be.id,
    'management',
    '/management/bills-expenses'
  FROM bills_expenses be
  LEFT JOIN notifications n ON (
    n.related_id = be.id 
    AND n.type = 'bill_due_soon' 
    AND n.user_role = 'management'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE be.expense_date = CURRENT_DATE + INTERVAL '3 days'
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_bills_overdue()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert notifications for overdue bills for admins
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    be.company_id,
    'Bill Overdue: ' || be.expense_title,
    'Bill "' || be.expense_title || '" ($' || be.amount || ') from ' || be.vendor_payee || ' was due on ' || be.expense_date::text,
    'bill_overdue',
    be.id,
    'admin',
    '/admin/bills-expenses/' || be.id
  FROM bills_expenses be
  LEFT JOIN notifications n ON (
    n.related_id = be.id 
    AND n.type = 'bill_overdue' 
    AND n.user_role = 'admin'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE be.expense_date < CURRENT_DATE
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL;

  -- Insert notifications for management
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    be.company_id,
    'Bill Overdue: ' || be.expense_title,
    'Bill "' || be.expense_title || '" ($' || be.amount || ') from ' || be.vendor_payee || ' was due on ' || be.expense_date::text,
    'bill_overdue',
    be.id,
    'management',
    '/management/bills-expenses'
  FROM bills_expenses be
  LEFT JOIN notifications n ON (
    n.related_id = be.id 
    AND n.type = 'bill_overdue' 
    AND n.user_role = 'management'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE be.expense_date < CURRENT_DATE
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL;
END;
$function$;

-- Update expiring certificates function for management
CREATE OR REPLACE FUNCTION public.check_expiring_certificates()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert notifications for certificates expiring within 30 days for admins
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
    AND n.user_role = 'admin'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE ec.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND ec.expiry_date > CURRENT_DATE
    AND n.id IS NULL;

  -- Insert notifications for management
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    ec.company_id,
    'Certificate Expiring Soon',
    'Certificate "' || ec.certificate_name || '" for employee expires on ' || ec.expiry_date::text,
    'certificate',
    ec.id,
    'management',
    '/management/employees'
  FROM employee_certificates ec
  LEFT JOIN notifications n ON (
    n.related_id = ec.id 
    AND n.type = 'certificate' 
    AND n.user_role = 'management'
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE ec.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND ec.expiry_date > CURRENT_DATE
    AND n.id IS NULL;
END;
$function$;