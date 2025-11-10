-- Drop the old restrictive policy on tasks
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON public.tasks;

-- Create new policy allowing employees to update any company task
CREATE POLICY "Employees can update company tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id = (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Drop the old restrictive policy on subtasks
DROP POLICY IF EXISTS "Employees can update assigned subtasks" ON public.subtasks;

-- Create new policy allowing employees to update any subtask in company tasks
CREATE POLICY "Employees can update company subtasks"
ON public.subtasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM tasks t
    WHERE t.id = subtasks.task_id 
    AND t.company_id = (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM tasks t
    WHERE t.id = subtasks.task_id 
    AND t.company_id = (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add comments explaining the policies
COMMENT ON POLICY "Employees can update company tasks" ON public.tasks IS 
'Allows any authenticated user in the company to update task status. The completed_by field is automatically set by the set_completed_by trigger.';

COMMENT ON POLICY "Employees can update company subtasks" ON public.subtasks IS 
'Allows any authenticated user in the company to update subtask status. The completed_by field is automatically set by the set_completed_by trigger.';