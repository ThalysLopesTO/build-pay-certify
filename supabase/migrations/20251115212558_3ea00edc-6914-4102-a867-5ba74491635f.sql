-- Drop the old TEXT version of get_client_portal_data function
-- This removes the duplicate function that was causing the "Access Denied" error
-- The UUID version (already fixed in previous migration) will handle string parameters automatically
DROP FUNCTION IF EXISTS get_client_portal_data(text);