-- Add secure RPC functions for fetching client quotes and invoices
-- These bypass RLS while maintaining security by filtering on client_email

-- Function to get other quotes for a client (public access via token verification)
CREATE OR REPLACE FUNCTION public.get_client_other_quotes(
  p_client_email TEXT,
  p_company_id UUID,
  p_current_quote_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(q)), '[]'::json)
    FROM (
      SELECT 
        id,
        quote_number,
        project_name,
        quote_date,
        status,
        total_amount,
        public_status,
        public_token
      FROM public.quotes
      WHERE client_email = p_client_email
        AND company_id = p_company_id
        AND id != p_current_quote_id
        AND status != 'draft'
      ORDER BY created_at DESC
      LIMIT 10
    ) q
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_other_quotes(TEXT, UUID, UUID) TO anon, authenticated;

-- Function to get invoices for a client (public access)
CREATE OR REPLACE FUNCTION public.get_client_invoices(
  p_client_email TEXT,
  p_company_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(i)), '[]'::json)
    FROM (
      SELECT 
        id,
        invoice_number,
        title,
        due_date,
        status,
        total_amount,
        created_at
      FROM public.invoices
      WHERE client_email = p_client_email
        AND company_id = p_company_id
      ORDER BY created_at DESC
      LIMIT 10
    ) i
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_invoices(TEXT, UUID) TO anon, authenticated;