-- Add new fields to quotes table for enhanced quote builder
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS client_message TEXT,
ADD COLUMN IF NOT EXISTS contract_disclaimer TEXT DEFAULT 'This quote is valid for the next 30 days, after which values may be subject to change.',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"mode": "full", "deposit_type": "percentage", "deposit_value": 0, "schedule_items": []}'::jsonb;

COMMENT ON COLUMN quotes.client_message IS 'Message shown to client on the quote';
COMMENT ON COLUMN quotes.contract_disclaimer IS 'Contract terms and disclaimer shown to client';
COMMENT ON COLUMN quotes.internal_notes IS 'Internal notes visible only to team, not shown to client';
COMMENT ON COLUMN quotes.payment_config IS 'Payment schedule configuration (full/deposit/schedule)';