-- Update bills_expenses policies to allow management users full access

-- Drop existing policies for bills_expenses
DROP POLICY IF EXISTS "Authorized users can create bills/expenses" ON public.bills_expenses;
DROP POLICY IF EXISTS "Authorized users can delete bills/expenses" ON public.bills_expenses;
DROP POLICY IF EXISTS "Authorized users can update bills/expenses" ON public.bills_expenses;

-- Create new policies that include management role for full access
CREATE POLICY "Authorized users can create bills/expenses" 
ON public.bills_expenses 
FOR INSERT 
TO public
WITH CHECK (
  company_id = get_user_company_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
      AND company_id = bills_expenses.company_id
    )
  )
);

CREATE POLICY "Authorized users can update bills/expenses" 
ON public.bills_expenses 
FOR UPDATE 
TO public
USING (
  company_id = get_user_company_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
      AND company_id = bills_expenses.company_id
    )
  )
);

CREATE POLICY "Authorized users can delete bills/expenses" 
ON public.bills_expenses 
FOR DELETE 
TO public
USING (
  company_id = get_user_company_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
      AND company_id = bills_expenses.company_id
    )
  )
);