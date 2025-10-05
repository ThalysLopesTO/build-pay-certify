-- Update rpc_time_summary_headers to include user profile data
DROP FUNCTION IF EXISTS public.rpc_time_summary_headers(uuid, text, text, uuid[], uuid[], text, text);

CREATE OR REPLACE FUNCTION public.rpc_time_summary_headers(
  p_company_id uuid,
  p_start_date text,
  p_end_date text,
  p_jobsite_ids uuid[],
  p_employee_ids uuid[],
  p_status text,
  p_tz text
)
RETURNS TABLE(
  jobsite_id uuid,
  jobsite_name text,
  employee_id uuid,
  employee_name text,
  employee_photo text,
  employee_role text,
  employee_position text,
  employee_trade text,
  total_minutes numeric,
  total_punches bigint,
  has_flags boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_ts timestamptz;
  v_end_ts timestamptz;
BEGIN
  -- Convert date strings to timestamptz in company timezone
  v_start_ts := (p_start_date || ' 00:00:00')::timestamp AT TIME ZONE p_tz;
  v_end_ts := (p_end_date || ' 23:59:59')::timestamp AT TIME ZONE p_tz;

  RETURN QUERY
  SELECT
    ts.jobsite_id,
    COALESCE(j.name, 'Unknown Jobsite') as jobsite_name,
    ts.user_id as employee_id,
    COALESCE(up.first_name || ' ' || up.last_name, 'Unknown Employee') as employee_name,
    up.photo_url as employee_photo,
    up.role as employee_role,
    up.position as employee_position,
    up.trade as employee_trade,
    COALESCE(SUM(
      CASE
        WHEN ts.check_in_time IS NOT NULL AND ts.check_out_time IS NOT NULL THEN
          EXTRACT(EPOCH FROM (ts.check_out_time - ts.check_in_time)) / 60.0
        ELSE 0
      END
    ), 0) as total_minutes,
    COUNT(ts.id) as total_punches,
    BOOL_OR(ts.status = 'flagged' OR ts.work_note IS NOT NULL) as has_flags
  FROM timesheets ts
  LEFT JOIN jobsites j ON j.id = ts.jobsite_id
  LEFT JOIN user_profiles up ON up.user_id = ts.user_id
  WHERE
    ts.company_id = p_company_id
    AND ts.check_in_time IS NOT NULL
    AND ts.check_in_time >= v_start_ts
    AND ts.check_in_time <= v_end_ts
    AND (p_jobsite_ids IS NULL OR ts.jobsite_id = ANY(p_jobsite_ids))
    AND (p_employee_ids IS NULL OR ts.user_id = ANY(p_employee_ids))
    AND (p_status IS NULL OR ts.status = p_status)
  GROUP BY ts.jobsite_id, j.name, ts.user_id, up.first_name, up.last_name, up.photo_url, up.role, up.position, up.trade
  ORDER BY jobsite_name, employee_name;
END;
$$;