-- Fix RLS policy for employee subtask updates by adding WITH CHECK clause
DROP POLICY IF EXISTS "Employees can update assigned subtasks" ON public.subtasks;

CREATE POLICY "Employees can update assigned subtasks"
ON public.subtasks FOR UPDATE
TO authenticated
USING (
  -- User can select the subtask if they're in the same company and assigned to it
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = subtasks.task_id 
    AND t.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 
    FROM public.subtask_assignees 
    WHERE subtask_id = subtasks.id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  -- User can update the subtask if they're in the same company and assigned to it
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = subtasks.task_id 
    AND t.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 
    FROM public.subtask_assignees 
    WHERE subtask_id = subtasks.id 
    AND user_id = auth.uid()
  )
);