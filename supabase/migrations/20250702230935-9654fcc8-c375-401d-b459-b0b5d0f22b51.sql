-- Extend notification types to include bills and invoices
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bill_due_soon';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bill_overdue';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_due_soon';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_overdue';

-- Function to check for bills due soon (3 days before due date)
CREATE OR REPLACE FUNCTION check_bills_due_soon()
RETURNS void
LANGUAGE plpgsql
AS $$
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
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days' -- Don't create duplicate notifications within 7 days
  )
  WHERE be.expense_date = CURRENT_DATE + INTERVAL '3 days'
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL; -- Only create if notification doesn't already exist
END;
$$;

-- Function to check for overdue bills (1 day after due date)
CREATE OR REPLACE FUNCTION check_bills_overdue()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for overdue bills
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
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE be.expense_date < CURRENT_DATE
    AND be.payment_status = 'unpaid'
    AND n.id IS NULL;
END;
$$;

-- Function to check for invoices due soon (3 days before due date)
CREATE OR REPLACE FUNCTION check_invoices_due_soon()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for invoices due in 3 days
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    i.company_id,
    'Invoice Due Soon: ' || i.title,
    'Invoice "' || i.title || '" ($' || i.total_amount || ') for ' || i.client_company || ' is due on ' || i.due_date::text,
    'invoice_due_soon',
    i.id,
    'admin',
    '/admin/invoice-management/' || i.id
  FROM invoices i
  LEFT JOIN notifications n ON (
    n.related_id = i.id 
    AND n.type = 'invoice_due_soon' 
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE i.due_date = CURRENT_DATE + INTERVAL '3 days'
    AND i.status = 'pending'
    AND n.id IS NULL;
END;
$$;

-- Function to check for overdue invoices (1 day after due date)
CREATE OR REPLACE FUNCTION check_invoices_overdue()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert notifications for overdue invoices
  INSERT INTO public.notifications (company_id, title, description, type, related_id, user_role, redirect_to)
  SELECT DISTINCT
    i.company_id,
    'Invoice Overdue: ' || i.title,
    'Invoice "' || i.title || '" ($' || i.total_amount || ') for ' || i.client_company || ' was due on ' || i.due_date::text,
    'invoice_overdue',
    i.id,
    'admin',
    '/admin/invoice-management/' || i.id
  FROM invoices i
  LEFT JOIN notifications n ON (
    n.related_id = i.id 
    AND n.type = 'invoice_overdue' 
    AND n.is_dismissed = false
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
  WHERE i.due_date < CURRENT_DATE
    AND i.status = 'pending'
    AND n.id IS NULL;
END;
$$;

-- Master function to run all notification checks
CREATE OR REPLACE FUNCTION run_daily_notification_checks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Run existing checks
  PERFORM check_expiring_certificates();
  PERFORM check_overdue_jobsites();
  
  -- Run new bill and invoice checks
  PERFORM check_bills_due_soon();
  PERFORM check_bills_overdue();
  PERFORM check_invoices_due_soon();
  PERFORM check_invoices_overdue();
  
  -- Clean up old notifications
  PERFORM cleanup_old_notifications();
END;
$$;