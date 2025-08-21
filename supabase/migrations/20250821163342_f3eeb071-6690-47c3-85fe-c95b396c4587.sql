-- Final approach to fix Security Definer View issue
-- Based on the linter error, let's check if this is related to specific function patterns

-- Let's check if any of our SECURITY DEFINER functions might be causing this
-- The linter might be flagging functions that behave like views (table-valued functions)

-- First, let's see which SECURITY DEFINER functions are absolutely necessary
-- and which ones can be converted to SECURITY INVOKER

-- Functions that MUST remain SECURITY DEFINER (they need elevated privileges):
-- 1. Functions that check user roles/permissions
-- 2. Functions that need to bypass RLS for legitimate admin operations
-- 3. Authentication-related functions

-- Functions that can be SECURITY INVOKER:
-- 1. Functions that just query data with proper RLS
-- 2. Functions that don't need elevated privileges

-- Let's create a comprehensive view to see what functions might be problematic
DO $$
DECLARE
    func_rec RECORD;
    func_count INTEGER := 0;
BEGIN
    -- Count and list all SECURITY DEFINER functions
    FOR func_rec IN 
        SELECT p.proname, 
               CASE WHEN p.proretset THEN 'SET-RETURNING' ELSE 'SCALAR' END as return_type,
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef = true
        ORDER BY p.proname
    LOOP
        func_count := func_count + 1;
        RAISE NOTICE 'SECURITY DEFINER function %: % (%) - %', func_count, func_rec.proname, func_rec.return_type, func_rec.args;
    END LOOP;
    
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', func_count;
END $$;

-- The issue might be that the linter is detecting ANY SECURITY DEFINER function
-- as potentially problematic. Let's try a different approach - 
-- Let's check if we have any functions that might not need SECURITY DEFINER

-- Check if our view is properly set up without security issues
SELECT 
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'company_registration_summary';