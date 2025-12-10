-- Add date_of_birth column to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN date_of_birth date;

-- Create function to check upcoming birthdays and create notifications
CREATE OR REPLACE FUNCTION public.check_upcoming_birthdays()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for birthdays in 2 days (for admins, management, foremen)
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    up.company_id,
    up.first_name || ' ' || up.last_name || '''s Birthday in 2 Days! 🎂',
    up.first_name || ' ' || up.last_name || ' has a birthday coming up on ' || to_char(
      make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM up.date_of_birth)::int, EXTRACT(DAY FROM up.date_of_birth)::int),
      'Month DD'
    ),
    'birthday_reminder',
    up.user_id,
    role_name,
    '/admin/employee-management'
  FROM user_profiles up
  CROSS JOIN (VALUES ('admin'), ('management'), ('foreman')) AS roles(role_name)
  LEFT JOIN notifications n ON (
    n.related_id = up.user_id 
    AND n.type = 'birthday_reminder' 
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE up.date_of_birth IS NOT NULL
    AND up.is_active = true
    AND EXTRACT(MONTH FROM up.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '2 days')
    AND EXTRACT(DAY FROM up.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '2 days')
    AND n.id IS NULL;
END;
$$;

-- Update run_daily_notification_checks to include birthday check
CREATE OR REPLACE FUNCTION public.run_daily_notification_checks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Run existing checks
  PERFORM check_expiring_certificates();
  PERFORM check_overdue_jobsites();
  
  -- Run bill and invoice checks
  PERFORM check_bills_due_soon();
  PERFORM check_bills_overdue();
  PERFORM check_invoices_due_soon();
  PERFORM check_invoices_overdue();
  
  -- Run birthday check
  PERFORM check_upcoming_birthdays();
  
  -- Clean up old notifications
  PERFORM cleanup_old_notifications();
END;
$$;