-- ============================================================
-- Super Admin: per-company usage (last login) — run in Supabase SQL Editor
-- ============================================================
-- Exposes the real last login per company by reading auth.users.last_sign_in_at.
-- Wrapped in a SECURITY DEFINER function (so it can read auth.users) and guarded
-- so only super admins can call it. The dashboard calls it via supabase.rpc().

CREATE OR REPLACE FUNCTION public.super_admin_company_usage()
RETURNS TABLE (company_id uuid, last_login timestamptz, member_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins may read platform-wide login data.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT
      up.company_id,
      MAX(au.last_sign_in_at) AS last_login,
      COUNT(*)::bigint        AS member_count
    FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.company_id IS NOT NULL
    GROUP BY up.company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.super_admin_company_usage() TO authenticated;
