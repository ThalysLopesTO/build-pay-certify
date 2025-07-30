-- Fix the approve_missed_punch_request function to work with the current timesheets table schema
CREATE OR REPLACE FUNCTION public.approve_missed_punch_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  request_record RECORD;
  result json;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM public.missed_punch_requests
  WHERE id = request_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Verify user has permission to approve
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND company_id = request_record.company_id
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Create or update timesheet entry based on punch type
  IF request_record.punch_type = 'in' THEN
    -- Insert new timesheet with punch in
    INSERT INTO public.timesheets (
      user_id,
      company_id,
      jobsite_id,
      check_in_time,
      status
    ) VALUES (
      request_record.employee_id,
      request_record.company_id,
      request_record.jobsite_id,
      request_record.corrected_time_in::timestamp,
      'active'
    );
  ELSIF request_record.punch_type = 'out' THEN
    -- Update existing open timesheet with punch out
    UPDATE public.timesheets 
    SET 
      check_out_time = request_record.corrected_time_out::timestamp,
      status = 'completed'
    WHERE user_id = request_record.employee_id
    AND DATE(check_in_time) = request_record.request_date
    AND check_out_time IS NULL
    AND company_id = request_record.company_id;
  ELSIF request_record.punch_type = 'both' THEN
    -- Insert complete timesheet entry
    INSERT INTO public.timesheets (
      user_id,
      company_id,
      jobsite_id,
      check_in_time,
      check_out_time,
      status
    ) VALUES (
      request_record.employee_id,
      request_record.company_id,
      request_record.jobsite_id,
      request_record.corrected_time_in::timestamp,
      request_record.corrected_time_out::timestamp,
      'completed'
    );
  END IF;
  
  -- Update request status
  UPDATE public.missed_punch_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = request_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Request approved and timesheet updated'
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
$function$;