-- Add admin response columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS admin_response_to_changes TEXT,
ADD COLUMN IF NOT EXISTS admin_responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_responded_by UUID REFERENCES auth.users(id);

-- Create function for admin to respond to change requests
CREATE OR REPLACE FUNCTION public.respond_to_quote_changes(
  p_quote_id UUID,
  p_response_message TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  quote_details JSON;
  admin_name TEXT;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: Admin privileges required'
    );
  END IF;
  
  -- Get quote and validate status
  SELECT q.* INTO quote_record
  FROM public.quotes q
  JOIN public.user_profiles up ON up.company_id = q.company_id
  WHERE q.id = p_quote_id
  AND q.public_status = 'changes_requested'
  AND up.user_id = auth.uid()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or not awaiting changes response'
    );
  END IF;
  
  -- Get admin name
  SELECT COALESCE(first_name || ' ' || last_name, 'Admin') INTO admin_name
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  -- Update quote with response
  UPDATE public.quotes
  SET 
    admin_response_to_changes = p_response_message,
    admin_responded_at = NOW(),
    admin_responded_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_quote_id;
  
  -- Build quote details for email
  quote_details := json_build_object(
    'quote_number', quote_record.quote_number,
    'project_name', quote_record.project_name,
    'client_name', quote_record.client_name,
    'client_change_request', quote_record.client_change_request,
    'admin_response', p_response_message,
    'admin_name', admin_name,
    'public_token', quote_record.public_token,
    'total_amount', quote_record.total_amount
  );
  
  -- Send email notification to client
  PERFORM public.send_quote_notification_email(
    quote_record.client_email,
    'changes_response'::text,
    quote_details
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Response sent to client successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.respond_to_quote_changes(UUID, TEXT) TO authenticated;