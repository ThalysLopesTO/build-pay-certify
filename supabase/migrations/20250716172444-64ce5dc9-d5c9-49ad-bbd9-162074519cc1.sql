-- Make all user_id reference columns nullable to support ON DELETE SET NULL
-- This allows employee deletion while preserving historical data

-- attention_reports table
ALTER TABLE public.attention_reports 
ALTER COLUMN submitted_by DROP NOT NULL;

-- audit_logs table
ALTER TABLE public.audit_logs 
ALTER COLUMN edited_by_user_id DROP NOT NULL;

ALTER TABLE public.audit_logs 
ALTER COLUMN employee_id DROP NOT NULL;

-- bills_expenses table
ALTER TABLE public.bills_expenses 
ALTER COLUMN created_by DROP NOT NULL;

-- cancellation_requests table
ALTER TABLE public.cancellation_requests 
ALTER COLUMN requested_by DROP NOT NULL;

-- employee_certificates table
ALTER TABLE public.employee_certificates 
ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE public.employee_certificates 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- inventory table
ALTER TABLE public.inventory 
ALTER COLUMN created_by DROP NOT NULL;

-- jobsite_tasks table
ALTER TABLE public.jobsite_tasks 
ALTER COLUMN created_by DROP NOT NULL;

-- material_requests table
ALTER TABLE public.material_requests 
ALTER COLUMN submitted_by DROP NOT NULL;

-- material_takeoff_notes table
ALTER TABLE public.material_takeoff_notes 
ALTER COLUMN created_by DROP NOT NULL;

-- password_reset_logs table
ALTER TABLE public.password_reset_logs 
ALTER COLUMN admin_user_id DROP NOT NULL;

ALTER TABLE public.password_reset_logs 
ALTER COLUMN target_user_id DROP NOT NULL;

-- quotes table
ALTER TABLE public.quotes 
ALTER COLUMN created_by DROP NOT NULL;

-- safety_templates table
ALTER TABLE public.safety_templates 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- timesheets table
ALTER TABLE public.timesheets 
ALTER COLUMN user_id DROP NOT NULL;

-- weekly_timesheet_audit_logs table
ALTER TABLE public.weekly_timesheet_audit_logs 
ALTER COLUMN edited_by_user_id DROP NOT NULL;