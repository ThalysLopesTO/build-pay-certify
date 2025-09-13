-- Drop the existing policy that excludes foremen
DROP POLICY IF EXISTS "Admins can manage certificates for company employees" ON public.employee_certificates;

-- Create updated policy that includes foremen
CREATE POLICY "Admins and foremen can manage certificates for company employees" 
ON public.employee_certificates 
FOR ALL 
USING (
  company_id IN ( 
    SELECT up.company_id
    FROM user_profiles up
    WHERE (
      up.user_id = auth.uid() 
      AND up.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'management'::text, 'foreman'::text])
    )
  )
)
WITH CHECK (
  company_id IN ( 
    SELECT up.company_id
    FROM user_profiles up
    WHERE (
      up.user_id = auth.uid() 
      AND up.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'management'::text, 'foreman'::text])
    )
  )
);