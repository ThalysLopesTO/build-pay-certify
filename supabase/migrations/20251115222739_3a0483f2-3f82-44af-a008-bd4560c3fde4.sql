-- Fix request_quote_changes_public with correct column names
CREATE OR REPLACE FUNCTION public.request_quote_changes_public(p_token text, p_message text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id uuid;
  v_quote_number text;
  v_client_name text;
  v_client_email text;
  v_company_id uuid;
  v_project_name text;
BEGIN
  -- Find the quote by token with explicit cast
  SELECT id, quote_number, client_name, client_email, company_id, project_name
  INTO v_quote_id, v_quote_number, v_client_name, v_client_email, v_company_id, v_project_name
  FROM quotes
  WHERE public_token = p_token::uuid;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Update quote with correct column names
  UPDATE quotes
  SET 
    status = 'sent',
    public_status = 'changes_requested',
    client_change_request = p_message,
    updated_at = now()
  WHERE id = v_quote_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Change request submitted successfully',
    'quote_id', v_quote_id,
    'quote_number', v_quote_number,
    'client_name', v_client_name,
    'project_name', v_project_name,
    'company_id', v_company_id
  );
END;
$$;

-- Create reset_quote_for_editing function
CREATE OR REPLACE FUNCTION public.reset_quote_for_editing(p_quote_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Verify admin has access to this quote
  IF NOT EXISTS (
    SELECT 1 FROM quotes q
    JOIN user_profiles up ON up.company_id = q.company_id
    WHERE q.id = p_quote_id AND up.user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Quote not found');
  END IF;
  
  -- Reset status to draft for editing
  UPDATE quotes
  SET 
    status = 'draft',
    public_status = NULL,
    client_change_request = NULL,
    admin_response_to_changes = NULL,
    admin_responded_at = NULL,
    admin_responded_by = NULL,
    updated_at = NOW()
  WHERE id = p_quote_id;
  
  RETURN json_build_object('success', true, 'message', 'Quote reset for editing');
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_quote_for_editing(UUID) TO authenticated;