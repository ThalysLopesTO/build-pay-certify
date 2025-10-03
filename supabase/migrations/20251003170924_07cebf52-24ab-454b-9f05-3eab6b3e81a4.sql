-- Fix timezone conversion in rpc_time_summary_details
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id UUID,
  p_employee_id UUID,
  p_start_date TEXT,
  p_end_date TEXT,
  p_timezone TEXT,
  p_jobsite_id UUID DEFAULT NULL
)
RETURNS TABLE(
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (t.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE p_timezone)::DATE AS punch_date,
    TO_CHAR(t.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE p_timezone, 'HH12:MI AM') AS check_in_time,
    CASE 
      WHEN t.check_out_time IS NOT NULL 
      THEN TO_CHAR(t.check_out_time AT TIME ZONE 'UTC' AT TIME ZONE p_timezone, 'HH12:MI AM')
      ELSE NULL
    END AS check_out_time,
    COALESCE(
      EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600.0,
      0
    ) AS hours_worked,
    COALESCE(j.name, 'Unknown Project') AS jobsite_name,
    COALESCE(t.status, 'completed') AS status
  FROM public.timesheets t
  LEFT JOIN public.jobsites j ON j.id = t.jobsite_id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND t.check_in_time IS NOT NULL
    AND (t.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE p_timezone)::DATE >= p_start_date::DATE
    AND (t.check_in_time AT TIME ZONE 'UTC' AT TIME ZONE p_timezone)::DATE <= p_end_date::DATE
    AND (p_jobsite_id IS NULL OR t.jobsite_id = p_jobsite_id)
  ORDER BY t.check_in_time DESC;
END;
$$;