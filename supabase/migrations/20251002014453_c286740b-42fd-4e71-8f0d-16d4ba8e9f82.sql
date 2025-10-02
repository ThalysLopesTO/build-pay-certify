-- Drop and recreate rpc_time_summary_details to fix the notes field issue
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, text, text, text);

CREATE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_start_date text,
  p_end_date text,
  p_timezone text DEFAULT 'America/Toronto'
)
RETURNS TABLE (
  punch_date date,
  check_in_time text,
  check_out_time text,
  hours_worked numeric,
  jobsite_name text,
  jobsite_id uuid,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (t.check_in_time AT TIME ZONE p_timezone)::date as punch_date,
    to_char(t.check_in_time AT TIME ZONE p_timezone, 'HH12:MI AM') as check_in_time,
    CASE 
      WHEN t.check_out_time IS NOT NULL 
      THEN to_char(t.check_out_time AT TIME ZONE p_timezone, 'HH12:MI AM')
      ELSE NULL
    END as check_out_time,
    CASE 
      WHEN t.check_out_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (t.check_out_time - t.check_in_time)) / 3600
      ELSE 0
    END as hours_worked,
    COALESCE(j.name, 'Unknown Project') as jobsite_name,
    t.jobsite_id,
    CASE 
      WHEN t.check_out_time IS NULL THEN 'active'
      ELSE 'completed'
    END as status
  FROM timesheets t
  LEFT JOIN jobsites j ON t.jobsite_id = j.id
  WHERE t.company_id = p_company_id
    AND t.employee_id = p_employee_id
    AND t.status IN ('approved', 'pending', 'active')
    AND (t.check_in_time AT TIME ZONE p_timezone)::date >= p_start_date::date
    AND (t.check_in_time AT TIME ZONE p_timezone)::date <= p_end_date::date
  ORDER BY t.check_in_time DESC;
END;
$$;