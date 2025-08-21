-- Fix Security Definer View Issue
-- The issue is that system views with special permissions are being exposed
-- Let's ensure that system views are not accessible through the API

-- Check if vault schema is exposed in the API
-- The vault.decrypted_secrets view should not be accessible to API users

-- First, let's see what schemas are currently exposed to different roles
SELECT 
    n.nspname as schema_name,
    r.rolname as role_name,
    CASE 
        WHEN has_schema_privilege(r.oid, n.oid, 'USAGE') THEN 'USAGE'
        ELSE 'NO ACCESS'
    END as access_level
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE n.nspname IN ('public', 'vault', 'extensions', 'auth', 'storage')
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY schema_name, role_name;