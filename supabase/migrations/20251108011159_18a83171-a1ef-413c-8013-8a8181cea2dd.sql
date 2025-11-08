-- Add foreign key constraints for task and subtask assignees
-- This allows proper joins to user_profiles for avatars and names

ALTER TABLE task_assignees
DROP CONSTRAINT IF EXISTS task_assignees_user_id_fkey;

ALTER TABLE task_assignees
ADD CONSTRAINT task_assignees_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

ALTER TABLE subtask_assignees
DROP CONSTRAINT IF EXISTS subtask_assignees_user_id_fkey;

ALTER TABLE subtask_assignees
ADD CONSTRAINT subtask_assignees_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
ON DELETE CASCADE;