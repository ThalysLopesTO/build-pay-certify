-- Drop overly-permissive anonymous SELECT policies added for the client portal.
--
-- These policies let ANY request made with the public anon key read every
-- company's clients, quotes, invoices, companies, and company_settings rows
-- (USING clauses were "portal_token IS NOT NULL" or "true", which match all rows).
--
-- They are not needed: the client portal reads data exclusively through
-- SECURITY DEFINER functions (get_client_portal_data, get_public_quote) and
-- edge functions using the service role, none of which rely on anon RLS.
--
-- Symptom this fixes: a logged-in user whose session silently expired was
-- downgraded to the anon role and saw clients from every company in the
-- client-picker dropdown.

DROP POLICY IF EXISTS "Allow anonymous portal access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow anonymous portal access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow anonymous portal access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow anonymous portal access to company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow anonymous portal access to companies" ON public.companies;
