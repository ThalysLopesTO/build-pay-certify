-- Create bulk_reorder_tasks RPC function for efficient task reordering
CREATE OR REPLACE FUNCTION bulk_reorder_tasks(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_update jsonb;
  user_company_id uuid;
  user_role text;
BEGIN
  -- Get user's company_id and role once
  SELECT company_id, role INTO user_company_id, user_role
  FROM user_profiles
  WHERE user_id = auth.uid();

  -- Verify user has permission (admin, foreman, management, super_admin)
  IF user_role NOT IN ('admin', 'super_admin', 'management', 'foreman') THEN
    RAISE EXCEPTION 'Insufficient permissions to reorder tasks';
  END IF;

  -- Loop through each task update
  FOR task_update IN SELECT * FROM jsonb_array_elements(task_updates)
  LOOP
    UPDATE tasks
    SET 
      sort_order = (task_update->>'sortOrder')::integer,
      updated_at = now()
    WHERE 
      id = (task_update->>'taskId')::uuid
      AND company_id = user_company_id;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION bulk_reorder_tasks(jsonb) TO authenticated;

-- Fix existing tasks with sort_order = 0
-- Assign sequential sort_order within each jobsite/date combination
WITH ranked_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY jobsite_id, task_date 
      ORDER BY created_at
    ) - 1 AS new_sort_order
  FROM tasks
  WHERE sort_order = 0
)
UPDATE tasks
SET sort_order = ranked_tasks.new_sort_order
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id;