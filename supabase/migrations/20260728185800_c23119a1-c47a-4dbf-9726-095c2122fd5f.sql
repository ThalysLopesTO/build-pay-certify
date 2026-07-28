CREATE OR REPLACE FUNCTION public.check_invoices_due_soon()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
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
    AND i.status <> 'draft'
    AND n.id IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_invoices_overdue()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
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
    AND i.status <> 'draft'
    AND n.id IS NULL;
END;
$function$;