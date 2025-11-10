-- Function to fetch quote by public_token (public access)
CREATE OR REPLACE FUNCTION get_public_quote(token_param UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quote_data json;
BEGIN
  -- Fetch the quote with line items
  SELECT json_build_object(
    'quote', row_to_json(q.*),
    'line_items', (
      SELECT json_agg(li.*)
      FROM quote_line_items li
      WHERE li.quote_id = q.id
      ORDER BY li.created_at ASC
    ),
    'company_settings', (
      SELECT row_to_json(cs.*)
      FROM company_settings cs
      WHERE cs.company_id = q.company_id
      LIMIT 1
    ),
    'company_logo', (
      SELECT logo_url
      FROM companies c
      WHERE c.id = q.company_id
    )
  ) INTO quote_data
  FROM quotes q
  WHERE q.public_token = token_param;

  -- Return null if quote not found
  IF quote_data IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN quote_data;
END;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION get_public_quote(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_quote(UUID) TO authenticated;

COMMENT ON FUNCTION get_public_quote IS 'Securely fetch quote data by public token for client viewing';

-- Function to update client_viewed_at timestamp
CREATE OR REPLACE FUNCTION mark_quote_viewed(token_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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