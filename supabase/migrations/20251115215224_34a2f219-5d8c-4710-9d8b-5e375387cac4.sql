-- Drop the UUID version of approve_quote_public that has incorrect status check
DROP FUNCTION IF EXISTS approve_quote_public(uuid, text);

-- The TEXT version will remain and handle all cases correctly
-- PostgreSQL will automatically cast string parameters when needed