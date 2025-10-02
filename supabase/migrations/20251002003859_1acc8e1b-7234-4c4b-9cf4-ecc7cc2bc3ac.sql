-- Helper function to clip minutes (for timezone-aware date boundaries)
CREATE OR REPLACE FUNCTION public.fn_clip_minutes(ts timestamptz, tz text)
RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN date_trunc('minute', ts AT TIME ZONE tz) AT TIME ZONE tz;
END;
$$;

-- RPC function to get time summary headers (jobsite × employee totals)
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
  total_minutes numeric,
  total_punches bigint,
  has_flags boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
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
    COALESCE(SUM(
      CASE
        WHEN ts.check_in_time IS NOT NULL AND ts.check_out_time IS NOT NULL THEN
          EXTRACT(EPOCH FROM (ts.check_out_time - ts.check_in_time)) / 60.0
        ELSE 0
      END
    ), 0) as total_minutes,
    COUNT(ts.id) as total_punches,
    BOOL_OR(ts.status = 'flagged' OR ts.notes IS NOT NULL) as has_flags
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
  GROUP BY ts.jobsite_id, j.name, ts.user_id, up.first_name, up.last_name
  ORDER BY jobsite_name, employee_name;
END;
$$;

-- RPC function to get time summary details (daily punches for an employee at a jobsite)
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_jobsite_id uuid,
  p_start_date text,
  p_end_date text,
  p_tz text
)
RETURNS TABLE(
  id uuid,
  date text,
  check_in_time text,
  check_out_time text,
  hours_worked numeric,
  status text,
  notes text,
  check_in_location text,
  check_out_location text,
  location_distance numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
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
    ts.id,
    TO_CHAR(ts.check_in_time AT TIME ZONE p_tz, 'YYYY-MM-DD') as date,
    TO_CHAR(ts.check_in_time AT TIME ZONE p_tz, 'HH24:MI:SS') as check_in_time,
    TO_CHAR(ts.check_out_time AT TIME ZONE p_tz, 'HH24:MI:SS') as check_out_time,
    COALESCE(ts.hours_worked, 0) as hours_worked,
    COALESCE(ts.status, 'active') as status,
    ts.notes,
    ts.check_in_location,
    ts.check_out_location,
    NULL::numeric as location_distance
  FROM timesheets ts
  WHERE
    ts.company_id = p_company_id
    AND ts.user_id = p_employee_id
    AND ts.jobsite_id = p_jobsite_id
    AND ts.check_in_time IS NOT NULL
    AND ts.check_in_time >= v_start_ts
    AND ts.check_in_time <= v_end_ts
  ORDER BY ts.check_in_time;
END;
$$;

-- Add performance indexes for time summary queries
CREATE INDEX IF NOT EXISTS idx_timesheets_company_jobsite_user_checkin 
ON timesheets(company_id, jobsite_id, user_id, check_in_time);

CREATE INDEX IF NOT EXISTS idx_timesheets_company_checkin 
ON timesheets(company_id, check_in_time);