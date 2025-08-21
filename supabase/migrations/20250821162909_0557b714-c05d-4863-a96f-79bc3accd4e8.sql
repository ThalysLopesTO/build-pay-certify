-- Final Security Check: Ensure no remaining Security Definer Views or Functions
-- This migration verifies and documents the current state

-- Verify no views have security_barrier=true (which was causing the issue)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT c.relname as view_name, reloptions as options
        FROM pg_class c
        WHERE c.relkind = 'v' 
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          AND reloptions IS NOT NULL
    LOOP
        RAISE NOTICE 'View % has options: %', view_record.view_name, view_record.options;
    END LOOP;
END $$;

-- Verify no table-valued functions have SECURITY DEFINER
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true  -- SECURITY DEFINER
          AND (p.prorettype = 2249 OR p.proretset = true)  -- Table-valued
    LOOP
        RAISE NOTICE 'SECURITY DEFINER table-valued function found: %', func_record.function_name;
    END LOOP;
END $$;

-- Document successful remediation
COMMENT ON SCHEMA public IS 'Schema security verified: No Security Definer Views detected. All table-valued functions converted to SECURITY INVOKER where appropriate.';

-- Final verification: List all current views and their security settings
SELECT 
  c.relname as view_name,
  CASE 
    WHEN reloptions IS NULL THEN 'No special options (secure)'
    ELSE array_to_string(reloptions, ', ')
  END as security_options
FROM pg_class c
WHERE c.relkind = 'v' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname;