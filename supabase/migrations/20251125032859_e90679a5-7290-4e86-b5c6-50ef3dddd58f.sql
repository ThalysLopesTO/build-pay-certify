-- CRITICAL FIX: Drop ALL overloaded rpc_time_summary_details functions
-- Found 3 functions causing PGRST203 error - must drop all and create exactly ONE

-- Drop function 1: Old signature with different parameter order
-- OID 212887: (uuid, uuid, uuid, date, date, text)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, uuid, date, date, text);

-- Drop function 2: Date types (wrong - TypeScript sends text)
-- OID 220911: (uuid, uuid, date, date, text, uuid)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, date, date, text, uuid);

-- Drop function 3: Text types (correct signature but will recreate cleanly)
-- OID 220914: (uuid, uuid, text, text, text, uuid)
DROP FUNCTION IF EXISTS public.rpc_time_summary_details(uuid, uuid, text, text, text, uuid);

-- Create the ONE AND ONLY canonical function
-- This MUST match the TypeScript call in useTimeSummaryDetails.ts line 53-60
CREATE OR REPLACE FUNCTION public.rpc_time_summary_details(
  p_company_id uuid,
  p_employee_id uuid,
  p_start_date text,
  p_end_date text,
  p_timezone text,
  p_jobsite_id uuid
)
RETURNS TABLE (
  punch_date date,
  check_in_time text,
  check_out_time text,
  hours_worked numeric,
  jobsite_name text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (t.check_in_time AT TIME ZONE p_timezone)::date AS punch_date,
    to_char(t.check_in_time AT TIME ZONE p_timezone, 'HH24:MI') AS check_in_time,
    to_char(t.check_out_time AT TIME ZONE p_timezone, 'HH24:MI') AS check_out_time,
    CASE 
      WHEN t.check_out_time IS NOT NULL THEN
        round(extract(epoch FROM (t.check_out_time - t.check_in_time)) / 3600.0, 2)
      ELSE 0
    END AS hours_worked,
    coalesce(j.name, 'Unknown Project') AS jobsite_name,
    CASE 
      WHEN t.flagged_by IS NOT NULL OR t.admin_flagged THEN 'flagged'
      WHEN t.edited_by_user_id IS NOT NULL THEN 'edited'
      ELSE 'normal'
    END AS status
  FROM timesheets t
  JOIN jobsites j ON j.id = t.jobsite_id
  WHERE t.company_id = p_company_id
    AND t.user_id = p_employee_id
    AND (p_jobsite_id IS NULL OR t.jobsite_id = p_jobsite_id)
    AND t.check_in_time IS NOT NULL
    AND (t.check_in_time AT TIME ZONE p_timezone)::date >= p_start_date::date
    AND (t.check_in_time AT TIME ZONE p_timezone)::date <= p_end_date::date
  ORDER BY t.check_in_time DESC;
END;
$$;

-- Add comment to prevent future overloading
COMMENT ON FUNCTION public.rpc_time_summary_details(uuid, uuid, text, text, text, uuid) IS
'CANONICAL time summary details function. DO NOT CREATE OVERLOADS.
Matches useTimeSummaryDetails.ts TypeScript call.
Parameters: p_company_id, p_employee_id, p_start_date (text), p_end_date (text), p_timezone (text), p_jobsite_id';

-- Verify only one function exists
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE p.proname = 'rpc_time_summary_details'
    AND ns.nspname = 'public';
  
  IF func_count != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 function, found %', func_count;
  END IF;
  
  RAISE NOTICE 'Successfully verified: exactly 1 rpc_time_summary_details function exists';
END $$;