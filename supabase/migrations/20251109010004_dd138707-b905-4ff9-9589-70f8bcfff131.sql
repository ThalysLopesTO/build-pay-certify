-- Add completed_by tracking for tasks and subtasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.subtasks 
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_completed_by ON public.tasks(completed_by);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed_by ON public.subtasks(completed_by);

-- Add foreign key constraints for proper joins with user_profiles
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_completed_by_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_completed_by_fkey 
FOREIGN KEY (completed_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

ALTER TABLE public.subtasks
DROP CONSTRAINT IF EXISTS subtasks_completed_by_fkey;

ALTER TABLE public.subtasks
ADD CONSTRAINT subtasks_completed_by_fkey 
FOREIGN KEY (completed_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Add trigger to automatically set completed_by when status changes to 'done'
CREATE OR REPLACE FUNCTION set_completed_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'done', record who did it
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_by = auth.uid();
    NEW.completed_at = NOW();
  -- If status is being changed FROM 'done' to something else, clear completion info
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_by = NULL;
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to tasks table
DROP TRIGGER IF EXISTS set_tasks_completed_by ON public.tasks;
CREATE TRIGGER set_tasks_completed_by
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_by();

-- Apply trigger to subtasks table
DROP TRIGGER IF EXISTS set_subtasks_completed_by ON public.subtasks;
CREATE TRIGGER set_subtasks_completed_by
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_by();