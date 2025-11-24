-- Fix PGRST203 RPC overloading error for rpc_time_summary_details
-- Drop all existing overloaded versions of the function

DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, date, date, text);
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, date, date, text, uuid);
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, date, uuid, date, text);
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(text, text, text, text, text, text);

-- Create ONE canonical function with clear parameter names matching TypeScript usage
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_start_date date,
  p_end_date date,
  p_timezone text,
  p_jobsite_id uuid
)
RETURNS TABLE (
  punch_date date,
  check_in_time timestamptz,
  check_out_time timestamptz,
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
    DATE(t.check_in_time AT TIME ZONE p_timezone) AS punch_date,
    t.check_in_time,
    t.check_out_time,
    CASE 
      WHEN t.check_in_time IS NOT NULL AND t.check_out_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600.0
      ELSE 0
    END AS hours_worked,
    COALESCE(j.name, 'Unknown Project') AS jobsite_name,
    COALESCE(t.status, 'completed') AS status
  FROM public.timesheets t
  LEFT JOIN public.jobsites j ON j.id = t.jobsite_id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND t.jobsite_id = p_jobsite_id
    AND DATE(t.check_in_time AT TIME ZONE p_timezone) >= p_start_date
    AND DATE(t.check_in_time AT TIME ZONE p_timezone) <= p_end_date
  ORDER BY t.check_in_time ASC;
END;
$$;