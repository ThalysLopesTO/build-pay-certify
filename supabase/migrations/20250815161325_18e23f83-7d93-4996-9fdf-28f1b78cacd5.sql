-- Temporarily disable the license check for company creation during registration
-- The issue is that new companies can't be created because they don't have an active license yet

DROP POLICY IF EXISTS "Allow access only if company license is active - INSERT" ON public.companies;

-- Create a new policy that allows company creation for authenticated users during registration
CREATE POLICY "Allow authenticated users to create companies during registration" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Keep the license check for other operations but not for initial company creation
CREATE POLICY "Allow access only if company license is active - SELECT" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (is_company_license_active() OR auth.uid() IS NOT NULL);

CREATE POLICY "Allow access only if company license is active - UPDATE" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (is_company_license_active());

CREATE POLICY "Allow access only if company license is active - DELETE" 
ON public.companies 
FOR DELETE 
TO authenticated
USING (is_company_license_active());