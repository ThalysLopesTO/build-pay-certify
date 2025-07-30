-- Update the approve_missed_punch_request function to properly handle timesheet updates
CREATE OR REPLACE FUNCTION public.approve_missed_punch_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  request_record RECORD;
  existing_timesheet_id uuid;
  result json;
  corrected_in_timestamp timestamp with time zone;
  corrected_out_timestamp timestamp with time zone;
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
  
  -- Construct proper timestamps from date and time
  IF request_record.corrected_time_in IS NOT NULL THEN
    corrected_in_timestamp := (request_record.request_date::text || ' ' || request_record.corrected_time_in)::timestamp with time zone;
  END IF;
  
  IF request_record.corrected_time_out IS NOT NULL THEN
    corrected_out_timestamp := (request_record.request_date::text || ' ' || request_record.corrected_time_out)::timestamp with time zone;
  END IF;
  
  -- Find existing timesheet for this employee on this date
  SELECT id INTO existing_timesheet_id
  FROM public.timesheets
  WHERE user_id = request_record.employee_id
  AND DATE(check_in_time) = request_record.request_date
  AND company_id = request_record.company_id
  LIMIT 1;
  
  -- If no timesheet exists for check_in_time date, try check_out_time date
  IF existing_timesheet_id IS NULL THEN
    SELECT id INTO existing_timesheet_id
    FROM public.timesheets
    WHERE user_id = request_record.employee_id
    AND DATE(check_out_time) = request_record.request_date
    AND company_id = request_record.company_id
    LIMIT 1;
  END IF;
  
  -- If still no timesheet exists, try created_at date
  IF existing_timesheet_id IS NULL THEN
    SELECT id INTO existing_timesheet_id
    FROM public.timesheets
    WHERE user_id = request_record.employee_id
    AND DATE(created_at) = request_record.request_date
    AND company_id = request_record.company_id
    LIMIT 1;
  END IF;
  
  -- Handle different punch types
  IF request_record.punch_type = 'in' THEN
    IF existing_timesheet_id IS NOT NULL THEN
      -- Update existing timesheet with corrected in time
      UPDATE public.timesheets
      SET 
        check_in_time = corrected_in_timestamp,
        jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
        updated_at = NOW()
      WHERE id = existing_timesheet_id;
    ELSE
      -- Create new timesheet with in time
      INSERT INTO public.timesheets (
        user_id,
        company_id,
        check_in_time,
        jobsite_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        request_record.employee_id,
        request_record.company_id,
        corrected_in_timestamp,
        request_record.jobsite_id,
        'active',
        NOW(),
        NOW()
      );
    END IF;
    
  ELSIF request_record.punch_type = 'out' THEN
    IF existing_timesheet_id IS NOT NULL THEN
      -- Update existing timesheet with corrected out time
      UPDATE public.timesheets
      SET 
        check_out_time = corrected_out_timestamp,
        jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
        status = 'completed',
        updated_at = NOW()
      WHERE id = existing_timesheet_id;
    ELSE
      RETURN '{"success": false, "error": "No existing timesheet found for out punch"}'::JSON;
    END IF;
    
  ELSIF request_record.punch_type = 'both' THEN
    IF existing_timesheet_id IS NOT NULL THEN
      -- Update existing timesheet with both corrected times
      UPDATE public.timesheets
      SET 
        check_in_time = corrected_in_timestamp,
        check_out_time = corrected_out_timestamp,
        jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
        status = 'completed',
        updated_at = NOW()
      WHERE id = existing_timesheet_id;
    ELSE
      -- Create new timesheet with both times
      INSERT INTO public.timesheets (
        user_id,
        company_id,
        check_in_time,
        check_out_time,
        jobsite_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        request_record.employee_id,
        request_record.company_id,
        corrected_in_timestamp,
        corrected_out_timestamp,
        request_record.jobsite_id,
        'completed',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  -- Update request status
  UPDATE public.missed_punch_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
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