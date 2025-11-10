-- Add columns for client actions
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_name_signed TEXT,
ADD COLUMN IF NOT EXISTS client_change_request TEXT;

-- Function to approve quote (client action)
CREATE OR REPLACE FUNCTION approve_quote_public(
  token_param UUID,
  client_name_param TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quote_record quotes;
  company_email TEXT;
  result json;
BEGIN
  -- Update quote with approval data
  UPDATE quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    accepted_date = NOW(),
    client_name_signed = client_name_param,
    updated_at = NOW()
  WHERE public_token = token_param
    AND public_status != 'approved' -- Prevent duplicate approvals
  RETURNING * INTO quote_record;

  -- Check if quote was found and updated
  IF quote_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Quote not found or already approved'
    );
  END IF;

  -- Get company email for notification
  SELECT cs.company_email INTO company_email
  FROM company_settings cs
  WHERE cs.company_id = quote_record.company_id
  LIMIT 1;

  -- Build success response with notification data
  result := json_build_object(
    'success', true,
    'quote_id', quote_record.id,
    'quote_number', quote_record.quote_number,
    'project_name', quote_record.project_name,
    'client_name', quote_record.client_name,
    'company_email', company_email
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_quote_public(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION approve_quote_public(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION approve_quote_public IS 'Client approves a quote by signing their name';

-- Function to request changes on quote (client action)
CREATE OR REPLACE FUNCTION request_quote_changes_public(
  token_param UUID,
  change_request_param TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quote_record quotes;
  company_email TEXT;
  result json;
BEGIN
  -- Update quote with change request
  UPDATE quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = change_request_param,
    updated_at = NOW()
  WHERE public_token = token_param
  RETURNING * INTO quote_record;

  -- Check if quote was found
  IF quote_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Quote not found'
    );
  END IF;

  -- Get company email for notification
  SELECT cs.company_email INTO company_email
  FROM company_settings cs
  WHERE cs.company_id = quote_record.company_id
  LIMIT 1;

  -- Build success response with notification data
  result := json_build_object(
    'success', true,
    'quote_id', quote_record.id,
    'quote_number', quote_record.quote_number,
    'project_name', quote_record.project_name,
    'client_name', quote_record.client_name,
    'client_change_request', change_request_param,
    'company_email', company_email
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION request_quote_changes_public(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION request_quote_changes_public(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION request_quote_changes_public IS 'Client requests changes to a quote with feedback message';