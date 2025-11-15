-- Fix the get_client_portal_data function to properly cast portal_token parameter
CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_portal_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_id uuid;
  v_company_id uuid;
  v_result json;
BEGIN
  -- Get client_id and company_id from the portal_token (with proper UUID casting)
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM clients
  WHERE portal_token = p_portal_token::uuid;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;
  
  -- Build the result JSON
  SELECT json_build_object(
    'client', json_build_object(
      'id', c.id,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'client_email', c.client_email,
      'client_phone', c.client_phone,
      'client_address', c.client_address
    ),
    'quotes', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', q.id,
        'quote_number', q.quote_number,
        'project_name', q.project_name,
        'quote_date', q.quote_date,
        'expiry_date', q.expiry_date,
        'status', q.status,
        'public_status', q.public_status,
        'total_amount', q.total_amount,
        'public_token', q.public_token,
        'notes', q.notes,
        'client_address', q.client_address,
        'client_viewed_at', q.client_viewed_at,
        'client_approved_at', q.client_approved_at,
        'client_declined_at', q.client_declined_at
      )), '[]'::json)
      FROM quotes q
      WHERE q.client_id = v_client_id
      ORDER BY q.created_at DESC
    ),
    'invoices', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', i.id,
        'invoice_number', i.invoice_number,
        'title', i.title,
        'due_date', i.due_date,
        'status', i.status,
        'total_amount', i.total_amount,
        'sent_date', i.sent_date,
        'notes', i.notes,
        'client_address', i.client_address,
        'subtotal', i.subtotal,
        'tax', i.tax,
        'discount', i.discount
      )), '[]'::json)
      FROM invoices i
      WHERE i.client_id = v_client_id
      ORDER BY i.created_at DESC
    ),
    'company_settings', (
      SELECT json_build_object(
        'company_name', cs.company_name,
        'company_logo_url', cs.company_logo_url,
        'company_email', cs.company_email,
        'company_phone', cs.company_phone,
        'company_address', cs.company_address
      )
      FROM company_settings cs
      WHERE cs.company_id = v_company_id
      LIMIT 1
    )
  ) INTO v_result
  FROM clients c
  WHERE c.id = v_client_id;
  
  RETURN v_result;
END;
$function$;