-- Drop and recreate rpc_time_summary_details with id and break_minutes
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, text, text, text, uuid);

CREATE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid, 
  p_employee_id uuid, 
  p_start_date text, 
  p_end_date text, 
  p_timezone text, 
  p_jobsite_id uuid
)
RETURNS TABLE(
  id uuid,
  punch_date date, 
  check_in_time text, 
  check_out_time text, 
  hours_worked numeric, 
  jobsite_name text, 
  status text,
  break_minutes integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    (t.check_in_time AT TIME ZONE p_timezone)::date AS punch_date,
    to_char(t.check_in_time AT TIME ZONE p_timezone, 'HH24:MI') AS check_in_time,
    to_char(t.check_out_time AT TIME ZONE p_timezone, 'HH24:MI') AS check_out_time,
    COALESCE(t.hours_worked, 0) AS hours_worked,
    COALESCE(j.name, 'Unknown Project') AS jobsite_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM audit_logs al 
        WHERE al.timesheet_id = t.id 
        LIMIT 1
      ) THEN 'edited'
      ELSE COALESCE(t.status, 'normal')
    END AS status,
    t.break_minutes
  FROM timesheets t
  LEFT JOIN jobsites j ON j.id = t.jobsite_id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND (p_jobsite_id IS NULL OR t.jobsite_id = p_jobsite_id)
    AND t.check_in_time IS NOT NULL
    AND (t.check_in_time AT TIME ZONE p_timezone)::date >= p_start_date::date
    AND (t.check_in_time AT TIME ZONE p_timezone)::date <= p_end_date::date
  ORDER BY t.check_in_time DESC;
END;
$function$;