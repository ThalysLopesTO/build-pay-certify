-- Add client_decline_reason column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS client_decline_reason TEXT;

COMMENT ON COLUMN quotes.client_decline_reason IS 'Reason provided by client when declining the quote';

-- Create function to decline a quote publicly (no auth required)
CREATE OR REPLACE FUNCTION public.decline_quote_public(
  p_token TEXT,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_record RECORD;
  v_admin_emails TEXT[];
  v_company_name TEXT;
  v_company_email TEXT;
  v_declined_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find the quote by public token
  SELECT * INTO v_quote_record
  FROM public.quotes
  WHERE public_token = p_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found'
    );
  END IF;
  
  -- Check if quote can be declined
  IF v_quote_record.public_status NOT IN ('awaiting_response', 'changes_requested') 
     AND v_quote_record.public_status IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote cannot be declined in current status'
    );
  END IF;
  
  -- Update quote status
  v_declined_at := NOW();
  
  UPDATE public.quotes
  SET 
    public_status = 'declined',
    status = 'declined',
    client_declined_at = v_declined_at,
    client_decline_reason = p_reason,
    updated_at = v_declined_at
  WHERE id = v_quote_record.id;
  
  -- Get company details
  SELECT name, email INTO v_company_name, v_company_email
  FROM public.companies
  WHERE id = v_quote_record.company_id;
  
  -- Get admin emails
  SELECT array_agg(DISTINCT up.email)
  INTO v_admin_emails
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.company_id = v_quote_record.company_id
    AND up.role IN ('admin', 'super_admin', 'management')
    AND up.is_active = true
    AND au.email IS NOT NULL;
  
  -- Add company email if exists
  IF v_company_email IS NOT NULL THEN
    v_admin_emails := array_append(v_admin_emails, v_company_email);
  END IF;
  
  -- Send notification email to admins
  IF array_length(v_admin_emails, 1) > 0 THEN
    PERFORM public.send_quote_notification_email(
      v_admin_emails,
      v_quote_record.client_name,
      COALESCE(v_quote_record.client_company, v_quote_record.client_name),
      v_quote_record.project_name,
      v_quote_record.quote_number,
      v_quote_record.total_amount::TEXT,
      'declined',
      json_build_object(
        'decline_reason', COALESCE(p_reason, 'No reason provided'),
        'declined_at', to_char(v_declined_at, 'Mon DD, YYYY at HH12:MI AM'),
        'quote_url', 'https://your-domain.com/admin/quotes/' || v_quote_record.id
      )
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Quote declined successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to public (anon users)
GRANT EXECUTE ON FUNCTION public.decline_quote_public(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.decline_quote_public(TEXT, TEXT) TO authenticated;