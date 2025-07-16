-- Update foreign key constraints to allow employee deletion while preserving historical data

-- First, drop the existing foreign key constraint on weekly_timesheets.submitted_by
ALTER TABLE public.weekly_timesheets 
DROP CONSTRAINT IF EXISTS weekly_timesheets_submitted_by_fkey;

-- Re-create the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.weekly_timesheets 
ADD CONSTRAINT weekly_timesheets_submitted_by_fkey 
FOREIGN KEY (submitted_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update other tables that reference user_profiles to use ON DELETE SET NULL

-- Update audit_logs table
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_edited_by_user_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_edited_by_user_id_fkey 
FOREIGN KEY (edited_by_user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_employee_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update weekly_timesheet_audit_logs table
ALTER TABLE public.weekly_timesheet_audit_logs 
DROP CONSTRAINT IF EXISTS weekly_timesheet_audit_logs_edited_by_user_id_fkey;

ALTER TABLE public.weekly_timesheet_audit_logs 
ADD CONSTRAINT weekly_timesheet_audit_logs_edited_by_user_id_fkey 
FOREIGN KEY (edited_by_user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update attention_reports table
ALTER TABLE public.attention_reports 
DROP CONSTRAINT IF EXISTS attention_reports_submitted_by_fkey;

ALTER TABLE public.attention_reports 
ADD CONSTRAINT attention_reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.attention_reports 
DROP CONSTRAINT IF EXISTS attention_reports_reviewed_by_fkey;

ALTER TABLE public.attention_reports 
ADD CONSTRAINT attention_reports_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update material_requests table
ALTER TABLE public.material_requests 
DROP CONSTRAINT IF EXISTS material_requests_submitted_by_fkey;

ALTER TABLE public.material_requests 
ADD CONSTRAINT material_requests_submitted_by_fkey 
FOREIGN KEY (submitted_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update material_takeoff_notes table
ALTER TABLE public.material_takeoff_notes 
DROP CONSTRAINT IF EXISTS material_takeoff_notes_created_by_fkey;

ALTER TABLE public.material_takeoff_notes 
ADD CONSTRAINT material_takeoff_notes_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.material_takeoff_notes 
DROP CONSTRAINT IF EXISTS material_takeoff_notes_updated_by_fkey;

ALTER TABLE public.material_takeoff_notes 
ADD CONSTRAINT material_takeoff_notes_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update other tables that reference user_profiles
ALTER TABLE public.bills_expenses 
DROP CONSTRAINT IF EXISTS bills_expenses_created_by_fkey;

ALTER TABLE public.bills_expenses 
ADD CONSTRAINT bills_expenses_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.employee_certificates 
DROP CONSTRAINT IF EXISTS employee_certificates_employee_id_fkey;

ALTER TABLE public.employee_certificates 
ADD CONSTRAINT employee_certificates_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.employee_certificates 
DROP CONSTRAINT IF EXISTS employee_certificates_uploaded_by_fkey;

ALTER TABLE public.employee_certificates 
ADD CONSTRAINT employee_certificates_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.safety_templates 
DROP CONSTRAINT IF EXISTS safety_templates_uploaded_by_fkey;

ALTER TABLE public.safety_templates 
ADD CONSTRAINT safety_templates_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_created_by_fkey;

ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.jobsite_tasks 
DROP CONSTRAINT IF EXISTS jobsite_tasks_created_by_fkey;

ALTER TABLE public.jobsite_tasks 
ADD CONSTRAINT jobsite_tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.quotes 
DROP CONSTRAINT IF EXISTS quotes_created_by_fkey;

ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.password_reset_logs 
DROP CONSTRAINT IF EXISTS password_reset_logs_admin_user_id_fkey;

ALTER TABLE public.password_reset_logs 
ADD CONSTRAINT password_reset_logs_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.password_reset_logs 
DROP CONSTRAINT IF EXISTS password_reset_logs_target_user_id_fkey;

ALTER TABLE public.password_reset_logs 
ADD CONSTRAINT password_reset_logs_target_user_id_fkey 
FOREIGN KEY (target_user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

ALTER TABLE public.cancellation_requests 
DROP CONSTRAINT IF EXISTS cancellation_requests_requested_by_fkey;

ALTER TABLE public.cancellation_requests 
ADD CONSTRAINT cancellation_requests_requested_by_fkey 
FOREIGN KEY (requested_by) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;

-- Update timesheets table (the daily timesheets)
ALTER TABLE public.timesheets 
DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;

ALTER TABLE public.timesheets 
ADD CONSTRAINT timesheets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(user_id) 
ON DELETE SET NULL;