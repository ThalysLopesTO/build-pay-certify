-- Fix client portal logo display by fetching from companies table instead of company_settings
CREATE OR REPLACE FUNCTION get_client_portal_data(p_portal_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_company_id uuid;
  v_result json;
BEGIN
  -- Get client_id and company_id from portal_token
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM clients
  WHERE portal_token = p_portal_token;

  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result with company info, fetching logo from companies table
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
      FROM clients c
      WHERE c.id = v_client_id
    ),
    'quotes', COALESCE((
      SELECT json_agg(
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
          'client_declined_at', q.client_declined_at
        )
      )
      FROM quotes q
      WHERE q.client_id = v_client_id
    ), '[]'::json),
    'invoices', COALESCE((
      SELECT json_agg(
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
      )
      FROM invoices i
      WHERE i.client_id = v_client_id
    ), '[]'::json),
    'company_settings', (
      SELECT json_build_object(
        'company_name', COALESCE(cs.company_name, co.name),
        'company_logo_url', co.logo_url,
        'company_email', cs.company_email,
        'company_phone', cs.company_phone,
        'company_address', cs.company_address
      )
      FROM company_settings cs
      LEFT JOIN companies co ON co.id = v_company_id
      WHERE cs.company_id = v_company_id
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;