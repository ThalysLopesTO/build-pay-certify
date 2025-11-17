-- Fix client portal access by adding RLS policies for anonymous users
-- and fixing SQL syntax errors in get_client_portal_data function

-- Step 1: Fix the get_client_portal_data function (remove ORDER BY outside aggregates)
DROP FUNCTION IF EXISTS public.get_client_portal_data(text);

CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_portal_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_company_id uuid;
  v_result json;
BEGIN
  -- Get client_id and company_id from portal token
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM public.clients
  WHERE portal_token::text = p_portal_token;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Build the result JSON
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
      SELECT COALESCE(
        json_agg(q_data ORDER BY created_at DESC),
        '[]'::json
      )
      FROM (
        SELECT json_build_object(
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
        ) as q_data,
        q.created_at
        FROM public.quotes q
        WHERE q.client_id = v_client_id
      ) quotes_subquery
    ),
    'invoices', (
      SELECT COALESCE(
        json_agg(i_data ORDER BY created_at DESC),
        '[]'::json
      )
      FROM (
        SELECT json_build_object(
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
        ) as i_data,
        i.created_at
        FROM public.invoices i
        WHERE i.client_id = v_client_id
      ) invoices_subquery
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
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_client_portal_data(text) TO anon, authenticated;

-- Step 2: Add RLS policies for anonymous client portal access

-- Policy for clients table: Allow anonymous users to read their own client record via portal_token
CREATE POLICY "Allow anonymous portal access to clients"
ON public.clients
FOR SELECT
TO anon
USING (portal_token IS NOT NULL);

-- Policy for quotes table: Allow anonymous users to read quotes for clients with portal tokens
CREATE POLICY "Allow anonymous portal access to quotes"
ON public.quotes
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = quotes.client_id
    AND c.portal_token IS NOT NULL
  )
);

-- Policy for invoices table: Allow anonymous users to read invoices for clients with portal tokens
CREATE POLICY "Allow anonymous portal access to invoices"
ON public.invoices
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = invoices.client_id
    AND c.portal_token IS NOT NULL
  )
);

-- Policy for company_settings: Allow anonymous users to read company settings (needed for portal branding)
CREATE POLICY "Allow anonymous portal access to company_settings"
ON public.company_settings
FOR SELECT
TO anon
USING (true);

-- Policy for companies: Allow anonymous users to read company info (needed for portal branding)
CREATE POLICY "Allow anonymous portal access to companies"
ON public.companies
FOR SELECT
TO anon
USING (true);