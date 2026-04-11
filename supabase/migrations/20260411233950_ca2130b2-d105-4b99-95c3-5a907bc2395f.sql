
-- Phase 1A: Extend jobsite_time_rules
ALTER TABLE public.jobsite_time_rules
  ADD COLUMN IF NOT EXISTS break_apply_after_minutes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS overtime_threshold_minutes integer DEFAULT 0;

-- Phase 1B: Add calculated fields to timesheets
ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS raw_minutes integer,
  ADD COLUMN IF NOT EXISTS adjusted_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS adjusted_end_time timestamptz,
  ADD COLUMN IF NOT EXISTS overtime_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_payable_minutes integer,
  ADD COLUMN IF NOT EXISTS overtime_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS time_rule_applied boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_override_by uuid,
  ADD COLUMN IF NOT EXISTS manual_override_at timestamptz;

-- Phase 1C: Create timesheet_audit_log table
CREATE TABLE IF NOT EXISTS public.timesheet_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id uuid NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  old_values jsonb,
  new_values jsonb,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_timesheet_audit_log_timesheet_id ON public.timesheet_audit_log(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_audit_log_company_id ON public.timesheet_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_overtime_status ON public.timesheets(overtime_status);

-- Enable RLS on audit log
ALTER TABLE public.timesheet_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view audit logs for their company
CREATE POLICY "Users can view audit logs for their company"
  ON public.timesheet_audit_log
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_current_user_company_id());

-- Security definer function for inserting audit log entries (admin/management only)
CREATE OR REPLACE FUNCTION public.insert_timesheet_audit_log(
  p_timesheet_id uuid,
  p_action text,
  p_reason text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_user_role text;
  v_log_id uuid;
BEGIN
  -- Get caller's role and company
  SELECT role, company_id INTO v_user_role, v_company_id
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  -- Only admin, super_admin, management can insert audit logs
  IF v_user_role NOT IN ('admin', 'super_admin', 'management') THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to write audit log';
  END IF;

  INSERT INTO public.timesheet_audit_log (
    timesheet_id, action, performed_by, reason, old_values, new_values, company_id
  ) VALUES (
    p_timesheet_id, p_action, auth.uid(), p_reason, p_old_values, p_new_values, v_company_id
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
