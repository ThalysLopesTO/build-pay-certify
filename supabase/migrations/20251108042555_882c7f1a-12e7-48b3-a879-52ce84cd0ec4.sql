-- Add new status values for tasks and subtasks (blocked, failed)
DO $$ BEGIN
  -- Update tasks status constraint
  ALTER TABLE tasks 
  DROP CONSTRAINT IF EXISTS tasks_status_check;
  
  ALTER TABLE tasks 
  ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'done', 'blocked', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  -- Update subtasks status constraint
  ALTER TABLE subtasks 
  DROP CONSTRAINT IF EXISTS subtasks_status_check;
  
  ALTER TABLE subtasks 
  ADD CONSTRAINT subtasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'done', 'blocked', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index for date-range queries
CREATE INDEX IF NOT EXISTS idx_tasks_date_range 
ON tasks(company_id, jobsite_id, task_date);

-- Add completed_at tracking for tasks
DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add completed_at tracking for subtasks
DO $$ BEGIN
  ALTER TABLE subtasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create function to set completed_at when status changes to 'done'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks
DROP TRIGGER IF EXISTS tasks_completed_at_trigger ON tasks;
CREATE TRIGGER tasks_completed_at_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_completed_at();

-- Create trigger for subtasks
DROP TRIGGER IF EXISTS subtasks_completed_at_trigger ON subtasks;
CREATE TRIGGER subtasks_completed_at_trigger
BEFORE UPDATE ON subtasks
FOR EACH ROW
EXECUTE FUNCTION set_completed_at();