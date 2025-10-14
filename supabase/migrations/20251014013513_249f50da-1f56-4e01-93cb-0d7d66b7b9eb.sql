-- Drop all existing versions of rpc_time_summary_details to ensure clean state
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(UUID, UUID, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(UUID, UUID, DATE, DATE, TEXT, UUID);

-- Create unified rpc_time_summary_details function with proper timezone handling
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
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Convert check_in_time to company timezone and extract date
    (t.check_in_time AT TIME ZONE p_timezone)::DATE as punch_date,
    
    -- Format check-in time in 12-hour format with AM/PM
    CASE 
      WHEN t.check_in_time IS NOT NULL THEN
        TO_CHAR(t.check_in_time AT TIME ZONE p_timezone, 'HH12:MI AM')
      ELSE NULL
    END as check_in_time,
    
    -- Format check-out time in 12-hour format with AM/PM
    CASE 
      WHEN t.check_out_time IS NOT NULL THEN
        TO_CHAR(t.check_out_time AT TIME ZONE p_timezone, 'HH12:MI AM')
      ELSE NULL
    END as check_out_time,
    
    -- Calculate hours worked
    CASE 
      WHEN t.check_in_time IS NOT NULL AND t.check_out_time IS NOT NULL THEN
        ROUND(EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600.0, 2)
      ELSE 0
    END as hours_worked,
    
    -- Get jobsite name
    COALESCE(j.name, 'No Project Assigned') as jobsite_name,
    
    -- Determine status
    CASE 
      WHEN t.check_out_time IS NULL THEN 'active'
      ELSE 'completed'
    END as status
    
  FROM public.timesheets t
  LEFT JOIN public.jobsites j ON j.id = t.jobsite_id
  
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    -- Apply date range filter using timezone-converted dates
    AND (t.check_in_time AT TIME ZONE p_timezone)::DATE >= p_start_date::DATE
    AND (t.check_in_time AT TIME ZONE p_timezone)::DATE <= p_end_date::DATE
    -- Apply jobsite filter
    AND t.jobsite_id = p_jobsite_id
    -- Only include valid timesheets (must have check-in time)
    AND t.check_in_time IS NOT NULL
    
  ORDER BY t.check_in_time DESC;
END;
$$;