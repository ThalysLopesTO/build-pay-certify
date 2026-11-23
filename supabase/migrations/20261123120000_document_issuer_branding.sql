-- Per-company business name (and payment details) for invoices and quotes.
--
-- A company can issue its invoices and quotes under another business name
-- than the one used everywhere else in the app. The name is copied onto each
-- invoice/quote when it is CREATED, so documents created earlier keep the
-- regular company name, and changing the setting later never rewrites
-- documents that were already sent. Address, phone, email, logo and HST stay
-- the company's own. Companies that leave these settings empty see no change.
-- Safe to run more than once.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS document_company_name TEXT,
  ADD COLUMN IF NOT EXISTS document_payment_details TEXT;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS issuer_name TEXT,
  ADD COLUMN IF NOT EXISTS issuer_payment_details TEXT;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS issuer_name TEXT,
  ADD COLUMN IF NOT EXISTS issuer_payment_details TEXT;

-- Copy the company's document branding onto a new invoice/quote
CREATE OR REPLACE FUNCTION public.set_document_issuer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.issuer_name IS NULL AND NEW.company_id IS NOT NULL THEN
    SELECT NULLIF(btrim(cs.document_company_name), ''),
           NULLIF(btrim(cs.document_payment_details), '')
      INTO NEW.issuer_name, NEW.issuer_payment_details
      FROM public.company_settings cs
     WHERE cs.company_id = NEW.company_id
     ORDER BY cs.updated_at DESC NULLS LAST
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_invoice_document_issuer ON public.invoices;
CREATE TRIGGER set_invoice_document_issuer
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_document_issuer();

DROP TRIGGER IF EXISTS set_quote_document_issuer ON public.quotes;
CREATE TRIGGER set_quote_document_issuer
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.set_document_issuer();

-- Client portal: the business name / payment details of one of the client's
-- own invoices, for the invoice PDF download. Same token check as
-- get_client_portal_data; returns nothing for anyone else's invoice.
CREATE OR REPLACE FUNCTION public.get_portal_invoice_branding(p_portal_token TEXT, p_invoice_id UUID)
RETURNS TABLE (issuer_name TEXT, issuer_payment_details TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.issuer_name, i.issuer_payment_details
    FROM public.invoices i
    JOIN public.clients c ON c.id = i.client_id
   WHERE c.portal_token::text = p_portal_token
     AND i.id = p_invoice_id
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_portal_invoice_branding(TEXT, UUID) TO anon, authenticated;
