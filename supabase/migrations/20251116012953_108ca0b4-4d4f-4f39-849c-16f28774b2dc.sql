-- Drop both overloaded versions of get_client_portal_data
DROP FUNCTION IF EXISTS public.get_client_portal_data(uuid);
DROP FUNCTION IF EXISTS public.get_client_portal_data(text);

-- Create single definitive function accepting text (as comes from URL)
CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_portal_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_client_id uuid;
  v_company_id uuid;
  v_result json;
BEGIN
  -- Get client_id and company_id from portal token (cast text to uuid)
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM public.clients
  WHERE portal_token = p_portal_token::uuid;  -- Cast text to uuid

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Build the result JSON with logo from companies table
  SELECT json_build_object(
    'client', (
      SELECT json_build_object(
        'id', c.id,
        'client_name', c.client_name,
        'client_company', c.client_company,
        'client_email', c.client_email,
        'client_phone', c.client_phone,
        'client_address', c.client_address
      )
      FROM public.clients c
      WHERE c.id = v_client_id
    ),
    'quotes', (
      SELECT COALESCE(json_agg(
        json_build_object(
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
          'client_declined_at', q.client_declined_at,
          'client_name_signed', q.client_name_signed,
          'accepted_date', q.accepted_date,
          'declined_date', q.declined_date,
          'client_change_request', q.client_change_request,
          'client_change_requested_at', q.client_change_requested_at
        )
      ), '[]'::json)
      FROM public.quotes q
      WHERE q.client_id = v_client_id
      ORDER BY q.created_at DESC
    ),
    'invoices', (
      SELECT COALESCE(json_agg(
        json_build_object(
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
        )
      ), '[]'::json)
      FROM public.invoices i
      WHERE i.client_id = v_client_id
      ORDER BY i.created_at DESC
    ),
    'company_settings', (
      SELECT json_build_object(
        'company_name', cs.company_name,
        'company_logo_url', comp.logo_url,
        'company_email', cs.company_email,
        'company_phone', cs.company_phone,
        'company_address', cs.company_address,
        'timezone', cs.timezone
      )
      FROM public.company_settings cs
      JOIN public.companies comp ON comp.id = cs.company_id
      WHERE cs.company_id = v_company_id
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;