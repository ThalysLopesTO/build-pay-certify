-- Add RLS policy to allow foremen to view employee profiles in their company
CREATE POLICY "Foremen can view company employee profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'foreman'
  )
);