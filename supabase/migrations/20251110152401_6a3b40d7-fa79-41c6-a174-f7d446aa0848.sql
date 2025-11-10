-- Add public client interaction fields to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS client_viewed_at timestamptz,
ADD COLUMN IF NOT EXISTS client_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS client_declined_at timestamptz,
ADD COLUMN IF NOT EXISTS client_name_signed text,
ADD COLUMN IF NOT EXISTS client_change_request text,
ADD COLUMN IF NOT EXISTS public_status text DEFAULT 'awaiting_response'
  CHECK (public_status IN ('awaiting_response', 'changes_requested', 'approved', 'declined'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes(public_token);
CREATE INDEX IF NOT EXISTS idx_quotes_public_status ON quotes(public_status);

-- Add comments for documentation
COMMENT ON COLUMN quotes.public_token IS 'Unique token for generating public client links';
COMMENT ON COLUMN quotes.public_status IS 'Client-facing status: awaiting_response, changes_requested, approved, declined';
COMMENT ON COLUMN quotes.client_viewed_at IS 'Timestamp when client first viewed the quote';
COMMENT ON COLUMN quotes.client_approved_at IS 'Timestamp when client approved the quote';
COMMENT ON COLUMN quotes.client_declined_at IS 'Timestamp when client declined the quote';
COMMENT ON COLUMN quotes.client_name_signed IS 'Client name as signed on approval';
COMMENT ON COLUMN quotes.client_change_request IS 'Client feedback/change request text';

-- Backfill public_status based on existing internal status
UPDATE quotes
SET public_status = CASE
  WHEN status = 'accepted' THEN 'approved'
  WHEN status = 'declined' THEN 'declined'
  WHEN status = 'sent' THEN 'awaiting_response'
  ELSE 'awaiting_response'
END
WHERE public_status IS NULL OR public_status = 'awaiting_response';

-- Backfill timestamps from existing date fields
UPDATE quotes
SET client_approved_at = accepted_date
WHERE status = 'accepted' AND accepted_date IS NOT NULL AND client_approved_at IS NULL;

UPDATE quotes
SET client_declined_at = declined_date
WHERE status = 'declined' AND declined_date IS NOT NULL AND client_declined_at IS NULL;