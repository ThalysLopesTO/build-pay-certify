-- Drop duplicate UUID version of request_quote_changes_public
DROP FUNCTION IF EXISTS request_quote_changes_public(uuid, text);

-- Fix approve_quote_public with explicit type cast
CREATE OR REPLACE FUNCTION public.approve_quote_public(p_token text, p_signed_name text)
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

  -- Update quote status to approved
  UPDATE quotes
  SET 
    status = 'approved',
    public_status = 'approved',
    client_approved_at = now(),
    client_name_signed = p_signed_name,
    accepted_date = now(),
    updated_at = now()
  WHERE id = v_quote_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Quote approved successfully',
    'quote_id', v_quote_id,
    'quote_number', v_quote_number,
    'client_name', v_client_name,
    'project_name', v_project_name,
    'company_id', v_company_id
  );
END;
$$;

-- Fix decline_quote_public with explicit type cast
CREATE OR REPLACE FUNCTION public.decline_quote_public(p_token text, p_reason text)
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

  -- Update quote status to declined
  UPDATE quotes
  SET 
    status = 'declined',
    public_status = 'declined',
    client_declined_at = now(),
    decline_reason = p_reason,
    updated_at = now()
  WHERE id = v_quote_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Quote declined successfully',
    'quote_id', v_quote_id,
    'quote_number', v_quote_number,
    'client_name', v_client_name,
    'project_name', v_project_name,
    'company_id', v_company_id
  );
END;
$$;

-- Fix request_quote_changes_public with explicit type cast
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

  -- Update quote status to changes requested
  UPDATE quotes
  SET 
    status = 'changes_requested',
    public_status = 'changes_requested',
    change_request_message = p_message,
    change_requested_at = now(),
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