-- Fix the approve_missed_punch_request function to properly update existing timesheets
CREATE OR REPLACE FUNCTION approve_missed_punch_request(
  request_id UUID,
  approver_id UUID
) RETURNS JSON AS $$
DECLARE
  request_record missed_punch_requests%ROWTYPE;
  existing_timesheet timesheets%ROWTYPE;
  result JSON;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM missed_punch_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Request not found or already processed"}'::JSON;
  END IF;

  -- Update request status
  UPDATE missed_punch_requests 
  SET 
    status = 'approved',
    reviewed_by = approver_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;

  -- Handle different punch types
  CASE request_record.punch_type
    WHEN 'in' THEN
      -- Find ANY timesheet for this user on this date (not just based on check_in_time)
      SELECT * INTO existing_timesheet
      FROM timesheets
      WHERE user_id = request_record.user_id 
        AND (
          DATE(check_in_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR DATE(check_out_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR (check_in_time IS NULL AND DATE(created_at) = request_record.punch_date)
        )
        AND company_id = request_record.company_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        -- Update existing timesheet with corrected in time
        UPDATE timesheets
        SET 
          check_in_time = request_record.corrected_in_time,
          jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
          updated_at = NOW()
        WHERE id = existing_timesheet.id;
      ELSE
        -- Create new timesheet with in time
        INSERT INTO timesheets (
          user_id,
          company_id,
          check_in_time,
          jobsite_id,
          created_at,
          updated_at
        ) VALUES (
          request_record.user_id,
          request_record.company_id,
          request_record.corrected_in_time,
          request_record.jobsite_id,
          NOW(),
          NOW()
        );
      END IF;

    WHEN 'out' THEN
      -- Find ANY timesheet for this user on this date
      SELECT * INTO existing_timesheet
      FROM timesheets
      WHERE user_id = request_record.user_id 
        AND (
          DATE(check_in_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR DATE(check_out_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR (check_in_time IS NULL AND DATE(created_at) = request_record.punch_date)
        )
        AND company_id = request_record.company_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        -- Update with corrected out time
        UPDATE timesheets
        SET 
          check_out_time = request_record.corrected_out_time,
          jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
          updated_at = NOW()
        WHERE id = existing_timesheet.id;
      ELSE
        RETURN '{"success": false, "error": "No existing timesheet found for out punch"}'::JSON;
      END IF;

    WHEN 'both' THEN
      -- Find ANY existing timesheet for this user on this date
      SELECT * INTO existing_timesheet
      FROM timesheets
      WHERE user_id = request_record.user_id 
        AND (
          DATE(check_in_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR DATE(check_out_time AT TIME ZONE 'UTC') = request_record.punch_date
          OR (check_in_time IS NULL AND DATE(created_at) = request_record.punch_date)
        )
        AND company_id = request_record.company_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        -- Update existing timesheet with both corrected times
        UPDATE timesheets
        SET 
          check_in_time = request_record.corrected_in_time,
          check_out_time = request_record.corrected_out_time,
          jobsite_id = COALESCE(request_record.jobsite_id, jobsite_id),
          updated_at = NOW()
        WHERE id = existing_timesheet.id;
      ELSE
        -- Create new timesheet with both times
        INSERT INTO timesheets (
          user_id,
          company_id,
          check_in_time,
          check_out_time,
          jobsite_id,
          created_at,
          updated_at
        ) VALUES (
          request_record.user_id,
          request_record.company_id,
          request_record.corrected_in_time,
          request_record.corrected_out_time,
          request_record.jobsite_id,
          NOW(),
          NOW()
        );
      END IF;
  END CASE;

  RETURN '{"success": true, "message": "Request approved and timesheet updated"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN format('{"success": false, "error": "%s"}', SQLERRM)::JSON;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;