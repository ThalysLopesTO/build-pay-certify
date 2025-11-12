-- Fix quote approval status check - change from 'pending' to 'awaiting_response'

-- Drop existing functions
DROP FUNCTION IF EXISTS public.approve_quote_public(text, text);
DROP FUNCTION IF EXISTS public.request_quote_changes_public(text, text);

-- Recreate approve_quote_public with correct status check
CREATE OR REPLACE FUNCTION public.approve_quote_public(
  p_token TEXT,
  p_signed_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  result json;
BEGIN
  -- Get quote data with correct status check
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE public_token = p_token
    AND public_status = 'awaiting_response';  -- Changed from 'pending'
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote to approved status
  UPDATE public.quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    client_name_signed = p_signed_name,
    accepted_date = NOW(),
    updated_at = NOW()
  WHERE id = quote_record.id;
  
  result := json_build_object(
    'success', true,
    'message', 'Quote approved successfully',
    'quote_id', quote_record.id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_quote_public(TEXT, TEXT) TO anon, authenticated;

-- Recreate request_quote_changes_public with correct status check
CREATE OR REPLACE FUNCTION public.request_quote_changes_public(
  p_token TEXT,
  p_message TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  result json;
BEGIN
  -- Get quote data with correct status check
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE public_token = p_token
    AND public_status = 'awaiting_response';  -- Changed from 'pending'
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote to changes_requested status
  UPDATE public.quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = p_message,
    updated_at = NOW()
  WHERE id = quote_record.id;
  
  result := json_build_object(
    'success', true,
    'message', 'Change request submitted successfully',
    'quote_id', quote_record.id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_quote_changes_public(TEXT, TEXT) TO anon, authenticated;