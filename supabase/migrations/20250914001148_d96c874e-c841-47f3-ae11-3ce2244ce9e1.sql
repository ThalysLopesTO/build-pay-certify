-- Fix security warnings for the newly created functions by adding proper search_path

-- Update check_expiring_certificates function with security definer and search path
CREATE OR REPLACE FUNCTION public.check_expiring_certificates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert notifications for certificates expiring within 30 days (for admin, management, foreman)
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    ec.company_id,
    'Certificate Expiring Soon',
    COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '') || '''s ' || ec.certificate_name || ' expires on ' || ec.expiry_date::text,
    'certificate',
    ec.id,
    role_type.role,
    '/admin/employee-management#certificates'
  FROM employee_certificates ec
  JOIN user_profiles up ON ec.employee_id = up.user_id
  CROSS JOIN (VALUES ('admin'), ('management'), ('foreman')) AS role_type(role)
  LEFT JOIN notifications n ON (
    n.related_id = ec.id 
    AND n.type = 'certificate' 
    AND n.user_role = role_type.role
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
    AND n.title = 'Certificate Expiring Soon'
  )
  WHERE ec.certificate_type != 'no-expiry'
    AND ec.expiry_date IS NOT NULL
    AND ec.expiry_date > CURRENT_DATE
    AND ec.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND n.id IS NULL;

  -- Insert notifications for expired certificates (notify once and stop)
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    ec.company_id,
    'Certificate Expired',
    COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '') || '''s ' || ec.certificate_name || ' expired on ' || ec.expiry_date::text,
    'certificate',
    ec.id,
    role_type.role,
    '/admin/employee-management#certificates'
  FROM employee_certificates ec
  JOIN user_profiles up ON ec.employee_id = up.user_id
  CROSS JOIN (VALUES ('admin'), ('management'), ('foreman')) AS role_type(role)
  LEFT JOIN notifications n ON (
    n.related_id = ec.id 
    AND n.type = 'certificate' 
    AND n.user_role = role_type.role
    AND n.title = 'Certificate Expired'
  )
  WHERE ec.certificate_type != 'no-expiry'
    AND ec.expiry_date IS NOT NULL
    AND ec.expiry_date < CURRENT_DATE
    AND n.id IS NULL; -- Only notify once for expired certificates
END;
$function$;

-- Update notify_certificate_status_change function with security definer and search path
CREATE OR REPLACE FUNCTION public.notify_certificate_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  employee_name text;
  notification_title text;
  notification_desc text;
  is_expired boolean;
  is_expiring boolean;
  role_name text;
BEGIN
  -- Skip if certificate type is no-expiry or no expiry date
  IF NEW.certificate_type = 'no-expiry' OR NEW.expiry_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get employee name
  SELECT COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')
  INTO employee_name
  FROM user_profiles up
  WHERE up.user_id = NEW.employee_id;

  -- Check if expired or expiring within 30 days
  is_expired := NEW.expiry_date < CURRENT_DATE;
  is_expiring := NEW.expiry_date > CURRENT_DATE AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days';

  -- Only proceed if certificate is expired or expiring soon
  IF NOT (is_expired OR is_expiring) THEN
    RETURN NEW;
  END IF;

  -- Set notification content based on status
  IF is_expired THEN
    notification_title := 'Certificate Expired';
    notification_desc := employee_name || '''s ' || NEW.certificate_name || ' expired on ' || NEW.expiry_date::text;
  ELSE
    notification_title := 'Certificate Expiring Soon';
    notification_desc := employee_name || '''s ' || NEW.certificate_name || ' expires on ' || NEW.expiry_date::text;
  END IF;

  -- Create notifications for admin, management, and foreman roles
  FOR role_name IN SELECT unnest(ARRAY['admin', 'management', 'foreman'])
  LOOP
    -- Check for existing notifications to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.related_id = NEW.id
        AND n.type = 'certificate'
        AND n.user_role = role_name
        AND n.title = notification_title
        AND (
          -- For expired: check if we already notified about this expired certificate
          (is_expired) OR
          -- For expiring: check within 7 days to prevent spam
          (is_expiring AND n.created_at > NOW() - INTERVAL '7 days' AND n.is_dismissed = false)
        )
    ) THEN
      INSERT INTO public.notifications (
        company_id, 
        title, 
        description, 
        type, 
        related_id, 
        user_role,
        redirect_to
      ) VALUES (
        NEW.company_id,
        notification_title,
        notification_desc,
        'certificate',
        NEW.id,
        role_name,
        '/admin/employee-management#certificates'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;