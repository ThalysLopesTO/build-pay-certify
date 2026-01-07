-- Create invoice_payments table
CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_total_cents INTEGER NOT NULL,
  application_fee_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'created',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS policy for company access
CREATE POLICY "Company members can view invoice payments"
  ON public.invoice_payments
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage invoice payments"
  ON public.invoice_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for faster lookups
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_checkout_session ON public.invoice_payments(stripe_checkout_session_id);
CREATE INDEX idx_invoice_payments_payment_intent ON public.invoice_payments(stripe_payment_intent_id);
CREATE INDEX idx_invoice_payments_company_id ON public.invoice_payments(company_id);

-- Trigger for updated_at
CREATE TRIGGER update_invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update get_client_portal_data function to include payment settings
CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_portal_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_company_id UUID;
  v_result JSON;
BEGIN
  -- Find the client by portal token
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM public.clients
  WHERE portal_token = p_portal_token;
  
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
          'client_declined_at', q.client_declined_at,
          'client_name_signed', q.client_name_signed,
          'accepted_date', q.accepted_date,
          'declined_date', q.declined_date,
          'client_change_request', q.client_change_request,
          'client_change_requested_at', q.client_change_requested_at
        )
        ORDER BY q.quote_date DESC
      )
      FROM public.quotes q
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
              ORDER BY li.created_at
            )
            FROM public.invoice_line_items li
            WHERE li.invoice_id = i.id
          ), '[]'::json)
        )
        ORDER BY i.due_date DESC
      )
      FROM public.invoices i
      WHERE i.client_id = v_client_id
    ), '[]'::json),
    'company_settings', (
      SELECT json_build_object(
        'company_name', cs.company_name,
        'company_logo_url', cs.company_logo_url,
        'company_email', cs.company_email,
        'company_phone', cs.company_phone,
        'company_address', cs.company_address,
        'timezone', cs.timezone,
        'payments_enabled', COALESCE(cs.payments_enabled, false),
        'stripe_connect_charges_enabled', COALESCE(cs.stripe_connect_charges_enabled, false)
      )
      FROM public.company_settings cs
      WHERE cs.company_id = v_company_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;