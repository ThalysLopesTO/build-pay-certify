-- Add columns for receipt extraction metadata
ALTER TABLE public.bills_expenses 
ADD COLUMN IF NOT EXISTS receipt_raw JSONB,
ADD COLUMN IF NOT EXISTS receipt_confidence JSONB,
ADD COLUMN IF NOT EXISTS extraction_status TEXT CHECK (extraction_status IN ('pending', 'completed', 'failed', 'manual'));

-- Add index for extraction status queries
CREATE INDEX IF NOT EXISTS idx_bills_expenses_extraction_status 
ON public.bills_expenses(extraction_status) 
WHERE extraction_status IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.bills_expenses.receipt_raw IS 'Raw extraction response from AI/OCR';
COMMENT ON COLUMN public.bills_expenses.receipt_confidence IS 'Confidence scores for extracted fields';
COMMENT ON COLUMN public.bills_expenses.extraction_status IS 'Status of receipt extraction: pending, completed, failed, manual';