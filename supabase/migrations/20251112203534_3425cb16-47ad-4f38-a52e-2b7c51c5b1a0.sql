-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS approve_quote_public(UUID, TEXT);
DROP FUNCTION IF EXISTS request_quote_changes_public(UUID, TEXT);

-- Function to approve a quote with client signature
CREATE OR REPLACE FUNCTION approve_quote_public(
  p_token UUID,
  p_signed_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    client_name_signed = p_signed_name,
    updated_at = NOW()
  WHERE public_token = p_token
    AND (public_status IS NULL OR public_status NOT IN ('approved', 'declined'));
  
  RETURN FOUND;
END;
$$;

-- Function to request changes to a quote
CREATE OR REPLACE FUNCTION request_quote_changes_public(
  p_token UUID,
  p_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = p_message,
    updated_at = NOW()
  WHERE public_token = p_token
    AND (public_status IS NULL OR public_status NOT IN ('approved', 'declined'));
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION approve_quote_public(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION approve_quote_public(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION request_quote_changes_public(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION request_quote_changes_public(UUID, TEXT) TO authenticated;