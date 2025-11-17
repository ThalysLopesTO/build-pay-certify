
-- Fix rpc_time_summary_details to properly filter dates and handle overnight shifts
-- This addresses the issue where dates outside the filter range (like Nov 06 when filtering Nov 07-14) are shown

-- Drop existing function first (with all possible signatures)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(UUID, UUID, TEXT, TEXT, TEXT, UUID);

-- Recreate function with proper date filtering
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id UUID,
  p_employee_id UUID,
  p_start_date TEXT,
  p_end_date TEXT,
  p_timezone TEXT,
  p_jobsite_id UUID
)
RETURNS TABLE (
  punch_date DATE,
  check_in_time TEXT,
  check_out_time TEXT,
  hours_worked NUMERIC,
  jobsite_name TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Use check_in date in company timezone as the punch date
    (t.check_in_time AT TIME ZONE p_timezone)::DATE as punch_date,
    
    -- Format times in company timezone
    TO_CHAR(t.check_in_time AT TIME ZONE p_timezone, 'HH24:MI') as check_in_time,
    TO_CHAR(t.check_out_time AT TIME ZONE p_timezone, 'HH24:MI') as check_out_time,
    
    -- Calculate hours worked
    CASE 
      WHEN t.check_out_time IS NOT NULL THEN
        ROUND(EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600.0, 2)
      ELSE 
        0
    END as hours_worked,
    
    j.name as jobsite_name,
    
    -- Determine status based on flags
    CASE 
      WHEN t.flagged_by IS NOT NULL OR t.admin_flagged = true THEN 'flagged'
      WHEN t.edited_by_user_id IS NOT NULL THEN 'edited'
      ELSE 'normal'
    END as status
    
  FROM timesheets t
  INNER JOIN jobsites j ON t.jobsite_id = j.id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND t.jobsite_id = p_jobsite_id
    AND t.check_in_time IS NOT NULL
    -- CRITICAL FIX: Properly filter by date range in company timezone
    -- Include punches where the check-in date (in company TZ) falls within the range
    -- OR where the check-out date (in company TZ) falls within the range (for overnight shifts)
    AND (
      -- Normal case: check-in date is within range
      (t.check_in_time AT TIME ZONE p_timezone)::DATE BETWEEN p_start_date::DATE AND p_end_date::DATE
      OR
      -- Overnight shift case: check-out date is within range
      (t.check_out_time IS NOT NULL AND (t.check_out_time AT TIME ZONE p_timezone)::DATE BETWEEN p_start_date::DATE AND p_end_date::DATE)
    )
  ORDER BY punch_date ASC, t.check_in_time ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.rpc_time_summary_details(UUID, UUID, TEXT, TEXT, TEXT, UUID) IS 'Returns detailed daily punch records for an employee at a specific jobsite within a date range. Properly handles timezone conversion and overnight shifts. Updated to fix date filtering bug where dates outside the filter range were showing.';
