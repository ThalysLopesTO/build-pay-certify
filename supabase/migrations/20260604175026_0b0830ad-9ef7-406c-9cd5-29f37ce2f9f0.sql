CREATE OR REPLACE FUNCTION public.decline_missed_punch_request(request_id uuid, p_decline_reason text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM public.missed_punch_requests
  WHERE id = request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  -- Verify user has permission to decline
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND company_id = request_record.company_id
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: insufficient permissions'
    );
  END IF;

  -- Decline the request
  UPDATE public.missed_punch_requests
  SET
    status = 'declined',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    decline_reason = p_decline_reason
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'request_id', request_id
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.decline_missed_punch_request(uuid, text) TO authenticated;