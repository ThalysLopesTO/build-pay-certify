-- Drop the old TEXT version of get_client_portal_data function
-- This removes the ambiguity and ensures the UUID version is always called
-- PostgreSQL will auto-cast the string parameter from JavaScript to UUID

DROP FUNCTION IF EXISTS public.get_client_portal_data(text);