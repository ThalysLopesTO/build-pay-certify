-- Enhance the approve_missed_punch_request function with better error handling, logging, and detailed feedback
DROP FUNCTION IF EXISTS public.approve_missed_punch_request(uuid);

CREATE OR REPLACE FUNCTION public.approve_missed_punch_request(request_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  request_record RECORD;
  existing_timesheet_id uuid;
  new_timesheet_id uuid;
  result json;
  corrected_in_timestamp timestamp with time zone;
  corrected_out_timestamp timestamp with time zone;
  company_timezone text;
  action_taken text;
  timesheet_details json;
BEGIN
  -- Log the approval attempt
  RAISE NOTICE 'Starting approval process for request %', request_id;

  -- Get the request details
  SELECT * INTO request_record
  FROM public.missed_punch_requests
  WHERE id = request_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Request % not found or already processed', request_id;
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;
  
  -- Verify user has permission to approve
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND company_id = request_record.company_id
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  ) THEN
    RAISE NOTICE 'Access denied for user % to approve request %', auth.uid(), request_id;
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: insufficient permissions'
    );
  END IF;
  
  -- Get company timezone for proper timestamp conversion
  SELECT timezone INTO company_timezone
  FROM public.company_settings
  WHERE company_id = request_record.company_id
  LIMIT 1;
  
  IF company_timezone IS NULL THEN
    company_timezone := 'America/Toronto'; -- Default timezone
  END IF;
  
  RAISE NOTICE 'Using timezone % for company %', company_timezone, request_record.company_id;
  
  -- Construct proper timestamps from date and time with timezone
  IF request_record.corrected_time_in IS NOT NULL THEN
    corrected_in_timestamp := (request_record.request_date::text || ' ' || request_record.corrected_time_in)::timestamp AT TIME ZONE company_timezone;
    RAISE NOTICE 'Corrected in timestamp: %', corrected_in_timestamp;
  END IF;
  
  IF request_record.corrected_time_out IS NOT NULL THEN
    corrected_out_timestamp := (request_record.request_date::text || ' ' || request_record.corrected_time_out)::timestamp AT TIME ZONE company_timezone;
    RAISE NOTICE 'Corrected out timestamp: %', corrected_out_timestamp;
  END IF;
  
  -- Find existing timesheet for this employee on this date using multiple strategies
  -- Strategy 1: Match by check_in_time date
  SELECT id INTO existing_timesheet_id
  FROM public.timesheets
  WHERE user_id = request_record.employee_id
  AND DATE(check_in_time AT TIME ZONE company_timezone) = request_record.request_date
  AND company_id = request_record.company_id
  LIMIT 1;
  
  -- Strategy 2: If not found, match by check_out_time date
  IF existing_timesheet_id IS NULL THEN
    SELECT id INTO existing_timesheet_id
    FROM public.timesheets
    WHERE user_id = request_record.employee_id
    AND DATE(check_out_time AT TIME ZONE company_timezone) = request_record.request_date
    AND company_id = request_record.company_id
    LIMIT 1;
  END IF;
  
  -- Strategy 3: If still not found, match by created_at date
  IF existing_timesheet_id IS NULL THEN
    SELECT id INTO existing_timesheet_id
    FROM public.timesheets
    WHERE user_id = request_record.employee_id
    AND DATE(created_at AT TIME ZONE company_timezone) = request_record.request_date
    AND company_id = request_record.company_id
    LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Found existing timesheet: %', existing_timesheet_id;
  
  -- Handle different punch types
  IF request_record.punch_type = 'in' THEN
    IF existing_timesheet_id IS NOT NULL THEN
      -- Update existing timesheet with corrected in time
      UPDATE public.timesheets
      SET 
        check_in_time = corrected_in_timestamp,
        jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
        status = 'active',
        updated_at = NOW()
      WHERE id = existing_timesheet_id;
      
      action_taken := 'updated_existing_in';
      RAISE NOTICE 'Updated existing timesheet % with in time', existing_timesheet_id;
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
      ) RETURNING id INTO new_timesheet_id;
      
      action_taken := 'created_new_in';
      existing_timesheet_id := new_timesheet_id;
      RAISE NOTICE 'Created new timesheet % with in time', new_timesheet_id;
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
      
      action_taken := 'updated_existing_out';
      RAISE NOTICE 'Updated existing timesheet % with out time', existing_timesheet_id;
    ELSE
      RAISE NOTICE 'No existing timesheet found for out punch';
      RETURN json_build_object(
        'success', false,
        'error', 'No existing timesheet found for punch out request'
      );
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
      
      action_taken := 'updated_existing_both';
      RAISE NOTICE 'Updated existing timesheet % with both times', existing_timesheet_id;
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
      ) RETURNING id INTO new_timesheet_id;
      
      action_taken := 'created_new_both';
      existing_timesheet_id := new_timesheet_id;
      RAISE NOTICE 'Created new timesheet % with both times', new_timesheet_id;
    END IF;
  END IF;
  
  -- Get updated timesheet details for response
  SELECT json_build_object(
    'timesheet_id', t.id,
    'employee_name', COALESCE(up.first_name || ' ' || up.last_name, 'Unknown Employee'),
    'jobsite_name', COALESCE(j.name, 'Unknown Jobsite'),
    'check_in_time', t.check_in_time,
    'check_out_time', t.check_out_time,
    'date', request_record.request_date,
    'action', action_taken
  ) INTO timesheet_details
  FROM public.timesheets t
  LEFT JOIN public.user_profiles up ON up.user_id = t.user_id
  LEFT JOIN public.jobsites j ON j.id = t.jobsite_id
  WHERE t.id = existing_timesheet_id;
  
  -- Update request status
  UPDATE public.missed_punch_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = request_id;
  
  RAISE NOTICE 'Successfully approved request % and updated timesheet', request_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Request approved and timesheet updated successfully',
    'details', timesheet_details
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in approve_missed_punch_request: %', SQLERRM;
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'request_id', request_id
    );
    RETURN result;
END;
$function$;