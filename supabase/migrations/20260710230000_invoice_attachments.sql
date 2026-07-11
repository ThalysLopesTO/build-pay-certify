-- Invoice attachments: files a business owner attaches to an invoice,
-- visible to the client in their portal and referenced in the invoice PDF.

CREATE TABLE public.invoice_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_attachments_invoice_id ON public.invoice_attachments(invoice_id);
CREATE INDEX idx_invoice_attachments_company_id ON public.invoice_attachments(company_id);

ALTER TABLE public.invoice_attachments ENABLE ROW LEVEL SECURITY;

-- Same access model as the clients table: company members can view,
-- admins/management manage. No anon policies — the client portal reads
-- attachments through the SECURITY DEFINER function below.
CREATE POLICY "Users can view invoice attachments in their company"
ON public.invoice_attachments FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

CREATE POLICY "Admins can manage invoice attachments"
ON public.invoice_attachments FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id()
  AND user_has_admin_role()
)
WITH CHECK (
  company_id = get_user_company_id()
  AND user_has_admin_role()
);

-- Storage bucket (public, like employee-photos/certificates: URLs contain a
-- random UUID path segment and are only shared with the invoice recipient)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-attachments', 'invoice-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view invoice attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-attachments');

CREATE POLICY "Authenticated users can upload invoice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete invoice attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoice-attachments'
  AND auth.role() = 'authenticated'
);

-- Expose attachments to the client portal (adds 'attachments' to each invoice)
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

  -- Build the result JSON with payment settings
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
          'tax_rate', COALESCE(i.tax, 0),
          'tax_amount', ROUND(i.subtotal * COALESCE(i.tax, 0) / 100, 2),
          'discount', i.discount,
          'line_items', COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', li.id,
                'description', li.description,
                'quantity', li.quantity,
                'unit_price', li.unit_price,
                'amount', li.amount
              )
            )
            FROM public.invoice_line_items li
            WHERE li.invoice_id = i.id
          ), '[]'::json),
          'attachments', COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'file_name', a.file_name,
                'file_url', a.file_url,
                'file_type', a.file_type,
                'file_size', a.file_size
              ) ORDER BY a.created_at
            )
            FROM public.invoice_attachments a
            WHERE a.invoice_id = i.id
          ), '[]'::json)
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
        'timezone', cs.timezone,
        'payments_enabled', COALESCE(cs.payments_enabled, false),
        'stripe_connect_charges_enabled', COALESCE(cs.stripe_connect_charges_enabled, false)
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

GRANT EXECUTE ON FUNCTION public.get_client_portal_data(text) TO anon, authenticated;
