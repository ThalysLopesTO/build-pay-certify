-- Properly drop the OLD buggy function and ensure only the FIXED version exists
-- This fixes the timezone boundary issue where Oct 19 shows when filtering Oct 20-24

-- Drop the OLD function with the buggy timezone logic (text status parameter)
DROP FUNCTION IF EXISTS public.rpc_time_summary_headers(uuid, text, text, uuid[], uuid[], text, text);

-- Drop and recreate the FIXED function to ensure clean state
DROP FUNCTION IF EXISTS public.rpc_time_summary_headers(uuid, text, text, text, uuid[], uuid[], text[]);

CREATE OR REPLACE FUNCTION public.rpc_time_summary_headers(
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
BEGIN
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
    -- CRITICAL FIX: Convert check_in_time to company timezone BEFORE comparing dates
    AND (ts.check_in_time AT TIME ZONE p_tz)::DATE >= p_start_date::DATE
    AND (ts.check_in_time AT TIME ZONE p_tz)::DATE <= p_end_date::DATE
    AND (p_jobsite_ids IS NULL OR ts.jobsite_id = ANY(p_jobsite_ids))
    AND (p_employee_ids IS NULL OR ts.user_id = ANY(p_employee_ids))
    AND (p_statuses IS NULL OR ts.status = ANY(p_statuses))
  GROUP BY ts.jobsite_id, j.name, ts.user_id, up.first_name, up.last_name, up.photo_url, up.role, up.position, up.trade
  ORDER BY jobsite_name, employee_name;
END;
$$;