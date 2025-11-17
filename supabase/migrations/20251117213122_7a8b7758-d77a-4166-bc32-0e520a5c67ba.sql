-- Drop the broken function
DROP FUNCTION IF EXISTS rpc_time_summary_details(uuid, uuid, uuid, date, date, text);

-- Recreate with correct column references
CREATE OR REPLACE FUNCTION rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_jobsite_id uuid,
  p_start_date date,
  p_end_date date,
  p_timezone text DEFAULT 'America/Toronto'
)
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  jobsite_id uuid,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status text,
  edited_note text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.employee_id,
    t.jobsite_id,
    t.check_in_time,
    t.check_out_time,
    t.status,
    t.edited_note
  FROM timesheets t
  WHERE t.company_id = p_company_id
    AND t.employee_id = p_employee_id
    AND t.jobsite_id = p_jobsite_id
    AND (
      (t.check_in_time AT TIME ZONE p_timezone)::date BETWEEN p_start_date AND p_end_date
      OR 
      (t.check_out_time AT TIME ZONE p_timezone)::date BETWEEN p_start_date AND p_end_date
    )
  ORDER BY t.check_in_time;
END;
$$;