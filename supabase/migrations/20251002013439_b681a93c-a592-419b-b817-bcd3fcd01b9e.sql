-- Update rpc_time_summary_details to include jobsite information
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_start_date text,
  p_end_date text,
  p_timezone text DEFAULT 'America/Toronto'
)
RETURNS TABLE (
  punch_date date,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  hours_worked numeric,
  jobsite_id uuid,
  jobsite_name text,
  status text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(fn_clip_minutes(t.check_in_time, p_timezone)) as punch_date,
    fn_clip_minutes(t.check_in_time, p_timezone) as check_in_time,
    fn_clip_minutes(t.check_out_time, p_timezone) as check_out_time,
    COALESCE(t.hours_worked, 0) as hours_worked,
    t.jobsite_id,
    COALESCE(j.name, 'Unknown Project') as jobsite_name,
    t.status,
    t.notes
  FROM public.timesheets t
  LEFT JOIN public.jobsites j ON j.id = t.jobsite_id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND t.check_in_time IS NOT NULL
    AND DATE(fn_clip_minutes(t.check_in_time, p_timezone)) >= p_start_date::date
    AND DATE(fn_clip_minutes(t.check_in_time, p_timezone)) <= p_end_date::date
  ORDER BY t.check_in_time DESC;
END;
$$;