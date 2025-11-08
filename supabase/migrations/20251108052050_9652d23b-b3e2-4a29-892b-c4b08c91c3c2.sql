-- Add sort_order column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order 
ON public.tasks(jobsite_id, task_date, sort_order);

-- Update existing tasks to have sequential sort_order based on created_at
UPDATE public.tasks
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY jobsite_id, task_date ORDER BY created_at) - 1 as row_num
  FROM public.tasks
) AS subquery
WHERE tasks.id = subquery.id;