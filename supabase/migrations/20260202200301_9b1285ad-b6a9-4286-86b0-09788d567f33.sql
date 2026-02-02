-- Add duplicate detection and fingerprint columns to bills_expenses
ALTER TABLE public.bills_expenses
ADD COLUMN IF NOT EXISTS receipt_hash TEXT,
ADD COLUMN IF NOT EXISTS vendor_detected TEXT,
ADD COLUMN IF NOT EXISTS date_detected DATE,
ADD COLUMN IF NOT EXISTS amount_detected NUMERIC,
ADD COLUMN IF NOT EXISTS category_detected_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duplicate_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES public.bills_expenses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duplicate_candidates JSONB;

-- Add constraint for duplicate_status values
ALTER TABLE public.bills_expenses
ADD CONSTRAINT chk_duplicate_status 
CHECK (duplicate_status IN ('none', 'possible', 'confirmed', 'ignored'));

-- Create indexes for efficient duplicate detection
CREATE INDEX IF NOT EXISTS idx_bills_expenses_receipt_hash 
ON public.bills_expenses(company_id, receipt_hash) 
WHERE receipt_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bills_expenses_duplicate_lookup 
ON public.bills_expenses(company_id, transaction_type, expense_date, amount);

CREATE INDEX IF NOT EXISTS idx_bills_expenses_vendor 
ON public.bills_expenses(company_id, vendor_payee);

-- Add comment for documentation
COMMENT ON COLUMN public.bills_expenses.receipt_hash IS 'SHA-256 hash of uploaded receipt image for duplicate detection';
COMMENT ON COLUMN public.bills_expenses.vendor_detected IS 'Original AI-extracted vendor name';
COMMENT ON COLUMN public.bills_expenses.date_detected IS 'Original AI-extracted date';
COMMENT ON COLUMN public.bills_expenses.amount_detected IS 'Original AI-extracted amount';
COMMENT ON COLUMN public.bills_expenses.category_detected_id IS 'Original AI-matched category ID';
COMMENT ON COLUMN public.bills_expenses.duplicate_status IS 'Duplicate status: none, possible, confirmed, ignored';
COMMENT ON COLUMN public.bills_expenses.duplicate_of_id IS 'Reference to the original transaction if marked as duplicate';
COMMENT ON COLUMN public.bills_expenses.duplicate_candidates IS 'Stored duplicate candidates at time of save';