-- Fix column name mismatches in quote approval functions
-- Drop existing functions
DROP FUNCTION IF EXISTS public.approve_quote_public(UUID, TEXT);
DROP FUNCTION IF EXISTS public.request_quote_changes_public(UUID, TEXT);

-- Recreate approve_quote_public with correct column names
CREATE OR REPLACE FUNCTION public.approve_quote_public(
  p_token UUID,
  p_signed_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
  v_company_id UUID;
  v_creator_id UUID;
  v_creator_email TEXT;
  v_creator_name TEXT;
  v_quote_number TEXT;
  v_project_name TEXT;
  v_client_email TEXT;
  v_company_name TEXT;
  v_company_logo TEXT;
BEGIN
  -- Get quote details from token
  SELECT id, company_id, created_by, quote_number, project_name, client_email
  INTO v_quote_id, v_company_id, v_creator_id, v_quote_number, v_project_name, v_client_email
  FROM public.quotes
  WHERE public_token = p_token
  AND public_status = 'pending';
  
  IF v_quote_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote status with FIXED column name
  UPDATE public.quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    client_name_signed = p_signed_name,
    accepted_date = NOW(),
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  -- Get creator details for notification
  SELECT email, CONCAT(first_name, ' ', last_name)
  INTO v_creator_email, v_creator_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE au.id = v_creator_id;
  
  -- Get company info with FIXED column name
  SELECT 
    cs.company_name,
    cs.company_logo_url
  INTO 
    v_company_name,
    v_company_logo
  FROM public.company_settings cs
  WHERE cs.company_id = v_company_id;
  
  RETURN json_build_object(
    'success', true,
    'quote_id', v_quote_id,
    'creator_email', v_creator_email,
    'creator_name', v_creator_name,
    'quote_number', v_quote_number,
    'project_name', v_project_name,
    'client_email', v_client_email,
    'signed_name', p_signed_name,
    'company_name', v_company_name,
    'company_logo', v_company_logo
  );
END;
$$;

-- Recreate request_quote_changes_public with correct column names
CREATE OR REPLACE FUNCTION public.request_quote_changes_public(
  p_token UUID,
  p_message TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
  v_company_id UUID;
  v_creator_id UUID;
  v_creator_email TEXT;
  v_creator_name TEXT;
  v_quote_number TEXT;
  v_project_name TEXT;
  v_client_email TEXT;
  v_company_name TEXT;
  v_company_logo TEXT;
BEGIN
  -- Get quote details from token
  SELECT id, company_id, created_by, quote_number, project_name, client_email
  INTO v_quote_id, v_company_id, v_creator_id, v_quote_number, v_project_name, v_client_email
  FROM public.quotes
  WHERE public_token = p_token
  AND public_status = 'pending';
  
  IF v_quote_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote status with FIXED column name
  UPDATE public.quotes
  SET 
    public_status = 'changes_requested',
    client_message = p_message,
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  -- Get creator details for notification
  SELECT email, CONCAT(first_name, ' ', last_name)
  INTO v_creator_email, v_creator_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE au.id = v_creator_id;
  
  -- Get company info with FIXED column name
  SELECT 
    cs.company_name,
    cs.company_logo_url
  INTO 
    v_company_name,
    v_company_logo
  FROM public.company_settings cs
  WHERE cs.company_id = v_company_id;
  
  RETURN json_build_object(
    'success', true,
    'quote_id', v_quote_id,
    'creator_email', v_creator_email,
    'creator_name', v_creator_name,
    'quote_number', v_quote_number,
    'project_name', v_project_name,
    'client_email', v_client_email,
    'message', p_message,
    'company_name', v_company_name,
    'company_logo', v_company_logo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_quote_public(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_quote_changes_public(UUID, TEXT) TO anon, authenticated;