-- Drop the old incorrect foreign keys if they exist (from previous migration)
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_completed_by_fkey;

ALTER TABLE public.subtasks
DROP CONSTRAINT IF EXISTS subtasks_completed_by_fkey;

-- Create correct foreign key constraints that reference user_profiles
-- This allows Supabase PostgREST to join tasks -> user_profiles directly

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_completed_by_fkey 
FOREIGN KEY (completed_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.subtasks
ADD CONSTRAINT subtasks_completed_by_fkey 
FOREIGN KEY (completed_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON CONSTRAINT tasks_completed_by_fkey ON public.tasks 
IS 'Links completed_by to user_profiles for completion tracking';

COMMENT ON CONSTRAINT subtasks_completed_by_fkey ON public.subtasks 
IS 'Links completed_by to user_profiles for completion tracking';