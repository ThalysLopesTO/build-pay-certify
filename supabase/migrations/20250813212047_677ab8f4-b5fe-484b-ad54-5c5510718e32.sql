-- Update RLS policy to include 'management' role for viewing timesheets
DROP POLICY IF EXISTS "Employees can view their own timesheets" ON public.timesheets;

CREATE POLICY "Employees can view their own timesheets" ON public.timesheets
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR 
  (EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = ANY (ARRAY['admin'::text, 'foreman'::text, 'super_admin'::text, 'management'::text])
    AND user_profiles.company_id = timesheets.company_id
  ))
);

-- Update RLS policy to include 'management' role for updating timesheets
DROP POLICY IF EXISTS "Admins and foremen can update employee timesheets" ON public.timesheets;

CREATE POLICY "Admins and foremen can update employee timesheets" ON public.timesheets
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'foreman'::text, 'management'::text])
    AND user_profiles.company_id = timesheets.company_id
  )
);

-- Update the other policy to include 'management' role as well
DROP POLICY IF EXISTS "Users can update timesheets based on role" ON public.timesheets;

CREATE POLICY "Users can update timesheets based on role" ON public.timesheets
FOR UPDATE 
USING (
  ((user_id = auth.uid()) AND (status = 'pending'))
  OR 
  (EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = ANY (ARRAY['admin'::text, 'foreman'::text, 'super_admin'::text, 'management'::text])
    AND user_profiles.company_id = timesheets.company_id
  ))
);