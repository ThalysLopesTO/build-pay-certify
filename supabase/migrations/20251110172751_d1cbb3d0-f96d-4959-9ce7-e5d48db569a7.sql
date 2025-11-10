-- Fix search_path security issue and ensure public_token consistency

-- Step 1: Populate public_token for existing quotes without tokens
UPDATE quotes 
SET public_token = gen_random_uuid() 
WHERE public_token IS NULL;

-- Step 2: Add NOT NULL constraint and default value for new quotes
ALTER TABLE quotes 
ALTER COLUMN public_token SET DEFAULT gen_random_uuid(),
ALTER COLUMN public_token SET NOT NULL;

-- Step 3: Recreate get_public_quote with proper search_path
CREATE OR REPLACE FUNCTION get_public_quote(token_param UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_data json;
BEGIN
  -- Fetch the quote with line items and company settings
  SELECT json_build_object(
    'quote', row_to_json(q.*),
    'line_items', COALESCE(
      (SELECT json_agg(row_to_json(qli.*))
       FROM quote_line_items qli
       WHERE qli.quote_id = q.id),
      '[]'::json
    ),
    'company_settings', row_to_json(cs.*),
    'company_logo', cs.company_logo_url
  )
  INTO quote_data
  FROM quotes q
  LEFT JOIN company_settings cs ON cs.company_id = q.company_id
  WHERE q.public_token = token_param;

  IF quote_data IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN quote_data;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_quote(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_quote(UUID) TO authenticated;

COMMENT ON FUNCTION get_public_quote IS 'Securely fetch quote data by public token for client viewing';

-- Step 4: Recreate mark_quote_viewed with proper search_path
CREATE OR REPLACE FUNCTION mark_quote_viewed(token_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET client_viewed_at = NOW()
  WHERE public_token = token_param
    AND client_viewed_at IS NULL;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_quote_viewed(UUID) TO anon;
GRANT EXECUTE ON FUNCTION mark_quote_viewed(UUID) TO authenticated;

COMMENT ON FUNCTION mark_quote_viewed IS 'Mark a quote as viewed by the client (first view only)';

-- Step 5: Recreate approve_quote_public with proper search_path
CREATE OR REPLACE FUNCTION approve_quote_public(
  token_param UUID,
  client_name_param TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record quotes;
  company_email TEXT;
  result json;
BEGIN
  -- Get quote and update approval status
  UPDATE quotes
  SET 
    client_approved_at = NOW(),
    client_name_signed = client_name_param,
    public_status = 'approved',
    status = 'accepted',
    accepted_date = NOW()
  WHERE public_token = token_param
  RETURNING * INTO quote_record;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found'
    );
  END IF;

  -- Get company email for notification
  SELECT company_email INTO company_email
  FROM company_settings
  WHERE company_id = quote_record.company_id;

  result := json_build_object(
    'success', true,
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

-- Step 6: Recreate request_quote_changes_public with proper search_path
CREATE OR REPLACE FUNCTION request_quote_changes_public(
  token_param UUID,
  change_request_param TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record quotes;
  company_email TEXT;
  result json;
BEGIN
  -- Get quote and update change request status
  UPDATE quotes
  SET 
    client_change_request = change_request_param,
    public_status = 'changes_requested'
  WHERE public_token = token_param
  RETURNING * INTO quote_record;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found'
    );
  END IF;

  -- Get company email for notification
  SELECT company_email INTO company_email
  FROM company_settings
  WHERE company_id = quote_record.company_id;

  result := json_build_object(
    'success', true,
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