-- Add Stripe payment fee breakdown columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_balance_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_processing_fee_cents INTEGER,
ADD COLUMN IF NOT EXISTS stackbuild_fee_cents INTEGER,
ADD COLUMN IF NOT EXISTS net_to_company_cents INTEGER,
ADD COLUMN IF NOT EXISTS payment_currency TEXT,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add index for quick lookups by payment intent
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent_id 
ON public.invoices(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.stripe_processing_fee_cents IS 'Stripe processing fee in cents from balance_transaction.fee';
COMMENT ON COLUMN public.invoices.stackbuild_fee_cents IS 'StackBuild platform fee (application_fee_amount) in cents';
COMMENT ON COLUMN public.invoices.net_to_company_cents IS 'Net amount company receives after all fees in cents';