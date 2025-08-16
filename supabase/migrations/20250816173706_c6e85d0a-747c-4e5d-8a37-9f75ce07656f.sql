-- Update RLS policies for inventory table to allow foremen to manage inventory

-- Drop existing admin-only policies
DROP POLICY IF EXISTS "Admins can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can delete inventory" ON public.inventory;

-- Create new policies that include foremen
CREATE POLICY "Admins and foremen can insert inventory" ON public.inventory
FOR INSERT
WITH CHECK (
  company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  AND (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = ANY(ARRAY['admin', 'super_admin', 'foreman'])
);

CREATE POLICY "Admins and foremen can update inventory" ON public.inventory
FOR UPDATE
USING (
  company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  AND (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = ANY(ARRAY['admin', 'super_admin', 'foreman'])
);

CREATE POLICY "Admins and foremen can delete inventory" ON public.inventory
FOR DELETE
USING (
  company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  AND (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = ANY(ARRAY['admin', 'super_admin', 'foreman'])
);