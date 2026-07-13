-- ============================================================================
-- MULTI-COMPANY MEMBERSHIP — PHASE 1 (database groundwork)
--
-- Lets one auth user hold user_profiles rows in multiple companies, with an
-- explicit "active company" pointer that all RLS helper functions resolve.
-- Behavior is identical for users with a single membership (the fallback path
-- reproduces today's logic exactly), so this ships before any frontend change.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Constraint swap: one profile row per (user, company) instead of per user
-- ----------------------------------------------------------------------------

-- Many tables reference user_profiles(user_id) as an FK target, which requires
-- UNIQUE(user_id) and blocks dropping it. Those columns hold auth user IDs, so
-- repoint every such FK at auth.users(id) first (same integrity guarantee, and
-- the correct target for per-company profiles: removing one membership must not
-- delete that user's timesheets/reports). Preserves each FK's ON DELETE/UPDATE.
DO $$
DECLARE
  fk RECORD;
  v_newdef text;
BEGIN
  FOR fk IN
    SELECT con.conname,
           con.conrelid::regclass AS child_table,
           pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    WHERE con.contype = 'f'
      AND con.confrelid = 'public.user_profiles'::regclass
      AND array_length(con.confkey, 1) = 1
      AND (SELECT attname FROM pg_attribute
           WHERE attrelid = con.confrelid AND attnum = con.confkey[1]) = 'user_id'
  LOOP
    v_newdef := regexp_replace(
      fk.def,
      'REFERENCES (public\.)?user_profiles\s*\(\s*user_id\s*\)',
      'REFERENCES auth.users(id)',
      'gi'
    );
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.child_table, fk.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', fk.child_table, fk.conname, v_newdef);
    RAISE NOTICE 'Repointed % on % to auth.users', fk.conname, fk.child_table;
  END LOOP;
END $$;

-- Both the migration-added and the base-table auto-named UNIQUE(user_id) must go
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_unique;
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
DROP INDEX IF EXISTS public.user_profiles_user_id_key;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_company_id_unique;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_user_id_company_id_unique UNIQUE (user_id, company_id);

-- ----------------------------------------------------------------------------
-- 2. Active-company pointer (written ONLY through set_active_company)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_active_company (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_active_company ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own active company" ON public.user_active_company;
CREATE POLICY "Users read own active company"
ON public.user_active_company FOR SELECT
TO authenticated
USING (user_id = auth.uid());
-- Intentionally no INSERT/UPDATE/DELETE policies: clients must use the RPC.

CREATE OR REPLACE FUNCTION public.set_active_company(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A user can only activate a company they actively belong to
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND is_active IS NOT FALSE
  ) THEN
    RAISE EXCEPTION 'Not an active member of this company';
  END IF;

  INSERT INTO public.user_active_company (user_id, company_id, updated_at)
  VALUES (auth.uid(), p_company_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = EXCLUDED.company_id, updated_at = now();

  RETURN p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_company(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Canonical company resolver: active pointer if valid, else first profile
--    (fallback = exactly today's behavior for single-membership users)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT uac.company_id
       FROM public.user_active_company uac
       JOIN public.user_profiles up
         ON up.user_id = uac.user_id
        AND up.company_id = uac.company_id
        AND up.is_active IS NOT FALSE
      WHERE uac.user_id = auth.uid()),
    (SELECT company_id FROM public.user_profiles
      WHERE user_id = auth.uid()
      ORDER BY created_at
      LIMIT 1)
  );
$$;

-- Service-side variant for edge functions (auth.uid() is NULL under the
-- service role): resolve a specific user's active company.
CREATE OR REPLACE FUNCTION public.get_active_company_id_for(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT uac.company_id
       FROM public.user_active_company uac
       JOIN public.user_profiles up
         ON up.user_id = uac.user_id
        AND up.company_id = uac.company_id
        AND up.is_active IS NOT FALSE
      WHERE uac.user_id = p_user_id),
    (SELECT company_id FROM public.user_profiles
      WHERE user_id = p_user_id
      ORDER BY created_at
      LIMIT 1)
  );
$$;

REVOKE ALL ON FUNCTION public.get_active_company_id_for(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_company_id_for(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_company_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_company_id();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_company_id();
$$;

-- ----------------------------------------------------------------------------
-- 4. Role helpers scoped to the ACTIVE company (admin-in-A must not pass admin
--    checks while working in B). IS NOT DISTINCT FROM keeps NULL-company
--    super_admin rows matching (their get_user_company_id() is NULL).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles
  WHERE user_id = auth.uid()
    AND company_id IS NOT DISTINCT FROM public.get_user_company_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_current_user_role() IN ('admin', 'super_admin', 'management'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_current_user_role() IN ('super_admin', 'admin', 'management'), false);
$$;

CREATE OR REPLACE FUNCTION public.user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_current_user_role() IN ('admin', 'super_admin', 'management', 'foreman'), false);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_manual_timesheets()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_current_user_role() IN ('super_admin', 'admin', 'management', 'foreman'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin_or_super_admin_for_view()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_current_user_role() IN ('super_admin', 'admin'), false)
      OR public.is_user_super_admin();
$$;

-- super_admin stays a GLOBAL concept: true if ANY membership row is super_admin
CREATE OR REPLACE FUNCTION public.is_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. Employee lifecycle functions: scope to the caller's ACTIVE company so
--    archiving/reactivating in company A never touches the person's
--    membership in company B.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_employee(employee_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  employee_profile record;
  result json;
BEGIN
  v_company_id := public.get_user_company_id();

  IF public.get_current_user_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete employees';
  END IF;

  SELECT up.*, up.id as profile_id INTO employee_profile
  FROM public.user_profiles up
  WHERE up.user_id = employee_user_id
    AND up.company_id = v_company_id;

  IF employee_profile IS NULL THEN
    RAISE EXCEPTION 'Employee not found or access denied';
  END IF;

  IF employee_profile.role IN ('admin', 'super_admin')
     AND NOT public.is_user_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can delete admin users';
  END IF;

  -- Soft delete THIS company's membership only
  UPDATE public.user_profiles
  SET is_active = false,
      updated_at = now()
  WHERE user_id = employee_user_id
    AND company_id = v_company_id;

  result := json_build_object(
    'success', true,
    'archived_user_id', employee_user_id,
    'archived_profile_id', employee_profile.profile_id
  );
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reactivate_employee(employee_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  employee_profile record;
  result json;
BEGIN
  v_company_id := public.get_user_company_id();

  IF public.get_current_user_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can reactivate employees';
  END IF;

  SELECT up.*, up.id as profile_id INTO employee_profile
  FROM public.user_profiles up
  WHERE up.user_id = employee_user_id
    AND up.company_id = v_company_id;

  IF employee_profile IS NULL THEN
    RAISE EXCEPTION 'Employee not found or access denied';
  END IF;

  UPDATE public.user_profiles
  SET is_active = true,
      updated_at = now()
  WHERE user_id = employee_user_id
    AND company_id = v_company_id;

  result := json_build_object(
    'success', true,
    'reactivated_user_id', employee_user_id,
    'reactivated_profile_id', employee_profile.profile_id
  );
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.permanently_delete_employee(employee_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  current_user_role text;
  employee_profile record;
  other_memberships integer;
  result json;
BEGIN
  v_company_id := public.get_user_company_id();
  current_user_role := public.get_current_user_role();

  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can permanently delete employees';
  END IF;

  IF employee_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  SELECT up.*, up.id as profile_id INTO employee_profile
  FROM public.user_profiles up
  WHERE up.user_id = employee_user_id
    AND up.company_id = v_company_id;

  IF employee_profile IS NULL THEN
    RAISE EXCEPTION 'Employee not found or access denied';
  END IF;

  IF employee_profile.role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can permanently delete super admin users';
  END IF;

  IF employee_profile.is_active = true THEN
    RAISE EXCEPTION 'Employee must be archived before permanent deletion';
  END IF;

  -- Company-scoped cleanup (this company's data only)
  DELETE FROM public.employee_certificates
  WHERE employee_id = employee_user_id
    AND company_id = v_company_id;

  DELETE FROM public.jobsite_foremen jf
  USING public.jobsites j
  WHERE jf.jobsite_id = j.id
    AND j.company_id = v_company_id
    AND jf.foreman_id = employee_user_id;

  SELECT COUNT(*) INTO other_memberships
  FROM public.user_profiles
  WHERE user_id = employee_user_id
    AND company_id IS DISTINCT FROM v_company_id;

  IF other_memberships > 0 THEN
    -- The person belongs to other companies: remove ONLY this membership,
    -- keep their login account and other companies' data untouched.
    DELETE FROM public.user_profiles
    WHERE user_id = employee_user_id
      AND company_id = v_company_id;

    result := json_build_object(
      'success', true,
      'deleted_user_id', employee_user_id,
      'deleted_profile_id', employee_profile.profile_id,
      'message', 'Employee removed from this company (account kept: member of other companies)'
    );
    RETURN result;
  END IF;

  -- Sole membership: full deletion as before (audit-trail nulling + auth user)
  UPDATE public.daily_reports SET submitted_by = NULL WHERE submitted_by = employee_user_id;
  UPDATE public.attention_reports SET submitted_by = NULL WHERE submitted_by = employee_user_id;
  UPDATE public.change_orders SET created_by = NULL WHERE created_by = employee_user_id;

  DELETE FROM auth.users WHERE id = employee_user_id;

  result := json_build_object(
    'success', true,
    'deleted_user_id', employee_user_id,
    'deleted_profile_id', employee_profile.profile_id,
    'message', 'Employee permanently deleted from system'
  );
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;

-- reset_quote_for_editing: add company scoping (previously updated any quote)
CREATE OR REPLACE FUNCTION public.reset_quote_for_editing(p_quote_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.quotes
  SET
    status = 'draft',
    public_status = NULL,
    admin_response_to_changes = NULL,
    admin_responded_at = NULL,
    admin_responded_by = NULL,
    updated_at = NOW()
  WHERE id = p_quote_id
    AND company_id = public.get_user_company_id();

  IF NOT FOUND THEN
    result := json_build_object('success', false, 'error', 'Quote not found');
    RETURN result;
  END IF;

  result := json_build_object('success', true, 'message', 'Quote reset successfully for editing');
  RETURN result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Rewrite RLS policies that inline the profile-company subquery.
--    Scalar form `= (SELECT company_id FROM user_profiles WHERE user_id =
--    auth.uid())` HARD-ERRORS once a user has two profile rows. Scan the live
--    catalog and swap the subquery for public.get_user_company_id().
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  v_pattern text := '=\s*\(\s*SELECT\s+(?:public\.)?(?:user_profiles\.)?company_id\s+FROM\s+(?:public\.)?user_profiles\s+WHERE\s+\(?\s*(?:public\.)?(?:user_profiles\.)?user_id\s*=\s*auth\.uid\(\)\s*\)?\s*\)';
  v_replacement text := '= public.get_user_company_id()';
  new_qual text;
  new_check text;
  v_sql text;
  v_count integer := 0;
BEGIN
  FOR pol IN
    SELECT * FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename <> 'user_profiles'
      AND (
        COALESCE(qual, '') ~* v_pattern
        OR COALESCE(with_check, '') ~* v_pattern
      )
  LOOP
    new_qual  := CASE WHEN pol.qual IS NOT NULL
                      THEN regexp_replace(pol.qual, v_pattern, v_replacement, 'gi')
                      ELSE NULL END;
    new_check := CASE WHEN pol.with_check IS NOT NULL
                      THEN regexp_replace(pol.with_check, v_pattern, v_replacement, 'gi')
                      ELSE NULL END;

    EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    v_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      pol.policyname, pol.schemaname, pol.tablename,
      pol.permissive, pol.cmd,
      array_to_string(pol.roles, ', ')
    );
    IF new_qual IS NOT NULL THEN
      v_sql := v_sql || ' USING (' || new_qual || ')';
    END IF;
    IF new_check IS NOT NULL THEN
      v_sql := v_sql || ' WITH CHECK (' || new_check || ')';
    END IF;

    EXECUTE v_sql;
    v_count := v_count + 1;
    RAISE NOTICE 'Rewrote policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;

  RAISE NOTICE 'Multi-company policy rewrite complete: % policies updated', v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6b. Hand-written rewrites for policies whose inline subquery also carried
--     role/is_active conditions. The automated rewrite in section 6 skips
--     these on purpose (a blind swap to get_user_company_id() would silently
--     drop the role restriction). Preserve the exact role sets, scoping the
--     membership lookup to the ACTIVE company and using EXISTS so it can never
--     return two rows into a scalar comparison.
-- ----------------------------------------------------------------------------

-- INSERT: only an active foreman/admin/super_admin of the active company may
-- create a daily report, and only for their own submissions in that company.
DROP POLICY IF EXISTS "Authorized users can create daily reports" ON public.daily_reports;
CREATE POLICY "Authorized users can create daily reports"
ON public.daily_reports FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
  AND company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND company_id = public.get_user_company_id()
      AND role IN ('foreman', 'admin', 'super_admin')
      AND is_active = true
  )
);

-- SELECT: active foreman/admin/super_admin/management of the active company
-- may view that company's daily reports.
DROP POLICY IF EXISTS "Company users can view daily reports" ON public.daily_reports;
CREATE POLICY "Company users can view daily reports"
ON public.daily_reports FOR SELECT
USING (
  company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND company_id = public.get_user_company_id()
      AND role IN ('foreman', 'admin', 'super_admin', 'management')
      AND is_active = true
  )
);

-- ----------------------------------------------------------------------------
-- 7. Post-migration check: list any REMAINING scalar inline subqueries
--    (should return 0 rows; IN(...)/EXISTS(...) forms are safe and expected)
-- ----------------------------------------------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    COALESCE(qual, '') ~* '=\s*\(\s*SELECT\s+(?:public\.)?(?:user_profiles\.)?company_id\s+FROM\s+(?:public\.)?user_profiles\s+WHERE'
    OR COALESCE(with_check, '') ~* '=\s*\(\s*SELECT\s+(?:public\.)?(?:user_profiles\.)?company_id\s+FROM\s+(?:public\.)?user_profiles\s+WHERE'
  );
