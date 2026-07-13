-- Let a user clear their OWN active-company pointer (used on logout so the
-- next login re-shows the company picker for multi-company users).
DROP POLICY IF EXISTS "Users delete own active company" ON public.user_active_company;
CREATE POLICY "Users delete own active company"
ON public.user_active_company FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Restore the clean set_active_company (a diagnostic version was used while
-- debugging). Validates active membership, then upserts the pointer.
CREATE OR REPLACE FUNCTION public.set_active_company(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
