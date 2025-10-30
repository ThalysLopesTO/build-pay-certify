-- Fix timezone boundary handling in rpc_time_summary_headers
-- This fixes the off-by-one-day error where Oct 20-24 shows Oct 19-23

DROP FUNCTION IF EXISTS rpc_time_summary_headers(uuid, text, text, text, uuid[], uuid[], text[]);

CREATE OR REPLACE FUNCTION rpc_time_summary_headers(
  p_company_id uuid,
  p_start_date text,
  p_end_date text,
  p_tz text DEFAULT 'America/Toronto',
  p_jobsite_ids uuid[] DEFAULT NULL,
  p_employee_ids uuid[] DEFAULT NULL,
  p_statuses text[] DEFAULT NULL
)
RETURNS TABLE(
  jobsite_id uuid,
  jobsite_name text,
  employee_id uuid,
  employee_name text,
  total_hours numeric,
  punch_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.jobsite_id,
    j.name AS jobsite_name,
    ts.employee_id,
    (up.first_name || ' ' || up.last_name) AS employee_name,
    ROUND(
      COALESCE(
        SUM(
          EXTRACT(EPOCH FROM (ts.check_out_time - ts.check_in_time)) / 3600.0
        ),
        0
      )::numeric,
      2
    ) AS total_hours,
    COUNT(*) AS punch_count
  FROM timesheets ts
  INNER JOIN jobsites j ON ts.jobsite_id = j.id
  INNER JOIN user_profiles up ON ts.employee_id = up.user_id
  WHERE ts.company_id = p_company_id
    AND ts.check_out_time IS NOT NULL
    -- Convert check_in_time to company timezone and compare dates
    AND (ts.check_in_time AT TIME ZONE p_tz)::DATE >= p_start_date::DATE
    AND (ts.check_in_time AT TIME ZONE p_tz)::DATE <= p_end_date::DATE
    -- Optional filters
    AND (p_jobsite_ids IS NULL OR ts.jobsite_id = ANY(p_jobsite_ids))
    AND (p_employee_ids IS NULL OR ts.employee_id = ANY(p_employee_ids))
    AND (p_statuses IS NULL OR ts.status = ANY(p_statuses))
  GROUP BY
    ts.jobsite_id,
    j.name,
    ts.employee_id,
    up.first_name,
    up.last_name
  ORDER BY
    j.name,
    employee_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;