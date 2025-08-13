-- Tighten RLS for material_requests: foremen can update only within 24h and only for pending/ordered; admins/managers unaffected

-- 1) Update existing generic update policy to exclude foremen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'material_requests' AND policyname = 'Admins and managers can update material requests'
  ) THEN
    -- Alter the policy to remove foreman from the role list
    ALTER POLICY "Admins and managers can update material requests"
    ON public.material_requests
    USING (
      (company_id = get_user_company_id())
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
            AND user_profiles.company_id = material_requests.company_id
        )
      )
    )
    WITH CHECK (
      (company_id = get_user_company_id())
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
            AND user_profiles.company_id = material_requests.company_id
        )
      )
    );
  END IF;
END $$;

-- 2) Replace foreman update policy with status-aware, 24h window constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'material_requests' AND policyname = 'Foremen can update their own material requests within 24 hours'
  ) THEN
    DROP POLICY "Foremen can update their own material requests within 24 hours" ON public.material_requests;
  END IF;

  CREATE POLICY "Foreman can update own request within 24h (pending/ordered)"
  ON public.material_requests
  FOR UPDATE
  USING (
    submitted_by = auth.uid()
    AND created_at > (now() - interval '24 hours')
    AND status IN ('pending','ordered')
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'foreman'
        AND user_profiles.company_id = material_requests.company_id
    )
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND created_at > (now() - interval '24 hours')
    AND status IN ('pending','ordered')
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'foreman'
        AND user_profiles.company_id = material_requests.company_id
    )
  );
END $$;

-- Note: We intentionally keep INSERT/SELECT/DELETE policies unchanged. Foremen have no DELETE policy, so deletes remain restricted.
