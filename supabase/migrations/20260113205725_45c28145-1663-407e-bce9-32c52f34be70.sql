-- Add enable_live_invoice_payments column as a safety guardrail for live invoice payments
-- Only super-admin can toggle this, preventing accidental real charges

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS enable_live_invoice_payments BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.company_settings.enable_live_invoice_payments 
IS 'Safety guardrail for live invoice payments. Only super-admin can enable for production-ready companies.';