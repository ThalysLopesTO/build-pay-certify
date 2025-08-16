-- Add RLS policy to allow users to view all employees in their company
CREATE POLICY "Users can view employees in their company" ON public.user_profiles
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);