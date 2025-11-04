-- Drop the existing policy that checks assigned_foreman_id
DROP POLICY IF EXISTS "Foremen can manage tasks for their assigned jobsites" ON jobsite_tasks;

-- Create new policy that checks the jobsite_foremen junction table
CREATE POLICY "Foremen can manage tasks for their assigned jobsites"
ON jobsite_tasks
FOR ALL
TO public
USING (
  -- Allow if foreman is assigned via junction table OR direct assignment
  jobsite_id IN (
    SELECT id 
    FROM jobsites 
    WHERE assigned_foreman_id = auth.uid()
  )
  OR
  jobsite_id IN (
    SELECT jobsite_id 
    FROM jobsite_foremen 
    WHERE foreman_id = auth.uid()
  )
)
WITH CHECK (
  jobsite_id IN (
    SELECT id 
    FROM jobsites 
    WHERE assigned_foreman_id = auth.uid()
  )
  OR
  jobsite_id IN (
    SELECT jobsite_id 
    FROM jobsite_foremen 
    WHERE foreman_id = auth.uid()
  )
);