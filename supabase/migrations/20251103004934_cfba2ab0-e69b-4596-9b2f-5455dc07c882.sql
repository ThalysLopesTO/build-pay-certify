-- Add missing foreign key constraints for equipment_usage_log
-- These are required for Supabase to properly join tables using the ! syntax

ALTER TABLE equipment_usage_log
  ADD CONSTRAINT fk_equipment_usage_employee
  FOREIGN KEY (employee_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

ALTER TABLE equipment_usage_log
  ADD CONSTRAINT fk_equipment_usage_assigned_by
  FOREIGN KEY (assigned_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- Re-add unique constraint to prevent double assignments
-- Only one employee can have the same equipment with status 'in_use'
CREATE UNIQUE INDEX idx_equipment_active_usage 
ON equipment_usage_log(equipment_id) 
WHERE status = 'in_use';