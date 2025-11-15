-- Update reset_quote_for_editing function to preserve client_change_request
CREATE OR REPLACE FUNCTION public.reset_quote_for_editing(p_quote_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  -- Reset quote status to allow editing while preserving client_change_request
  UPDATE public.quotes
  SET 
    status = 'draft',
    public_status = NULL,
    admin_response_to_changes = NULL,
    admin_responded_at = NULL,
    admin_responded_by = NULL,
    updated_at = NOW()
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'Quote not found'
    );
    RETURN result;
  END IF;

  result := json_build_object(
    'success', true,
    'message', 'Quote reset successfully for editing'
  );
  
  RETURN result;
END;
$function$;