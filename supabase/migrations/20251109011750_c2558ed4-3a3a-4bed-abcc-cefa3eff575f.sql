-- Drop existing problematic policy
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON public.tasks;

-- Create security definer function to check task assignment
-- This function bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_task(
  _task_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM task_assignees
    WHERE task_id = _task_id
      AND user_id = _user_id
  );
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Employees can update assigned tasks" 
ON public.tasks
FOR UPDATE 
USING (
  company_id = (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
  AND public.is_user_assigned_to_task(id, auth.uid())
)
WITH CHECK (
  company_id = (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
  AND public.is_user_assigned_to_task(id, auth.uid())
);

-- Add helpful comment
COMMENT ON FUNCTION public.is_user_assigned_to_task IS 
'Security definer function to check if a user is assigned to a task. Used in RLS policies to avoid infinite recursion.';