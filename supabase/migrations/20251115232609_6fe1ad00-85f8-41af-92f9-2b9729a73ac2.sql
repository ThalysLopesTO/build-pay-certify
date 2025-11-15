-- Add timestamp column for tracking when client requested changes
ALTER TABLE quotes 
ADD COLUMN client_change_requested_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN quotes.client_change_requested_at IS 'Timestamp when the client submitted their change request';