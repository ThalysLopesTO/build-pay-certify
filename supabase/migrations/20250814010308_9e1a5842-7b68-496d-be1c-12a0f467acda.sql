-- Add database indexes for optimal query performance

-- Index for time_clock_entries (Live Punch Monitor queries)
CREATE INDEX IF NOT EXISTS idx_time_clock_entries_company_date_employee 
ON public.time_clock_entries (company_id, punch_date, employee_id);

-- Index for material_requests (Material Requests page queries)
CREATE INDEX IF NOT EXISTS idx_material_requests_company_created_status 
ON public.material_requests (company_id, created_at DESC, status);

-- Index for attention_reports (Reports page queries)  
CREATE INDEX IF NOT EXISTS idx_attention_reports_company_status_date
ON public.attention_reports (company_id, status, report_date DESC);

-- Index for notifications (Dashboard notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_company_role_dismissed
ON public.notifications (company_id, user_role, is_dismissed, created_at DESC);

-- Index for timesheets (Timesheet queries)
CREATE INDEX IF NOT EXISTS idx_timesheets_user_date
ON public.timesheets (user_id, check_in_time DESC);

-- Index for jobsites (Dropdown queries)
CREATE INDEX IF NOT EXISTS idx_jobsites_company_status
ON public.jobsites (company_id, status);

-- Index for user_profiles (Auth and profile queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_role
ON public.user_profiles (company_id, role, is_active);

-- Index for company_settings (Settings queries)
CREATE INDEX IF NOT EXISTS idx_company_settings_company
ON public.company_settings (company_id);