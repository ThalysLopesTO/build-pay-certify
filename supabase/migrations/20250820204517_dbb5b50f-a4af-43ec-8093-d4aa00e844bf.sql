-- Fix expense categories access for management role users
-- Drop existing restrictive policy and create a new one that includes management role

-- Drop the existing policy that only allows admin and super_admin
DROP POLICY IF EXISTS "Company admins can manage expense categories" ON public.expense_categories;

-- Create new policy that includes management role
CREATE POLICY "Company admins and management can manage expense categories" 
ON public.expense_categories 
FOR ALL 
TO authenticated
USING (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = expense_categories.company_id
  ))
)
WITH CHECK (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = expense_categories.company_id
  ))
);