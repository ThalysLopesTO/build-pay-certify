
-- Drop ALL existing overloaded rpc_time_summary_details functions
-- We identified 3 different signatures causing PGRST203 error

-- Drop function with 6 params (old order: company, jobsite, employee, start, end, tz)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, uuid, text, text, text);

-- Drop function with 5 params (no jobsite filter)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, text, text, text);

-- Drop function with 6 params (correct order but will recreate)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, text, text, text, uuid);

-- Create the ONE canonical function that matches TypeScript call exactly
-- Parameters: p_company_id, p_employee_id, p_start_date, p_end_date, p_timezone, p_jobsite_id
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_start_date text,
  p_end_date text,
  p_timezone text,
  p_jobsite_id uuid
)
RETURNS TABLE (
  punch_date date,
  check_in_time text,
  check_out_time text,
  hours_worked numeric,
  jobsite_name text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Use check_in date in company timezone as the punch date
    (t.check_in_time AT TIME ZONE p_timezone)::DATE as punch_date,
    
    -- Format times in company timezone (HH24:MI for consistency)
    TO_CHAR(t.check_in_time AT TIME ZONE p_timezone, 'HH24:MI') as check_in_time,
    TO_CHAR(t.check_out_time AT TIME ZONE p_timezone, 'HH24:MI') as check_out_time,
    
    -- Calculate hours worked
    CASE 
      WHEN t.check_out_time IS NOT NULL THEN
        ROUND(EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600.0, 2)
      ELSE 
        0
    END as hours_worked,
    
    COALESCE(j.name, 'Unknown Project') as jobsite_name,
    
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
    -- Filter by date range in company timezone
    AND (t.check_in_time AT TIME ZONE p_timezone)::DATE >= p_start_date::DATE
    AND (t.check_in_time AT TIME ZONE p_timezone)::DATE <= p_end_date::DATE
  ORDER BY t.check_in_time DESC;
END;
$$;

-- Add comment explaining the function signature
COMMENT ON FUNCTION public.rpc_time_summary_details(uuid, uuid, text, text, text, uuid) IS 
'Canonical time summary details function. DO NOT create overloads. 
Parameters must match TypeScript call in useTimeSummaryDetails.ts:
- p_company_id: Company UUID
- p_employee_id: Employee/user UUID  
- p_start_date: Start date as text (YYYY-MM-DD)
- p_end_date: End date as text (YYYY-MM-DD)
- p_timezone: Timezone string (e.g. America/Toronto)
- p_jobsite_id: Jobsite UUID filter';
