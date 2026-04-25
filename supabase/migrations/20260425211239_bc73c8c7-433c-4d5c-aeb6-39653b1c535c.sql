-- Create manual_timesheets table (independent from weekly_timesheets / timesheets)
CREATE TABLE public.manual_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  employee_name text NOT NULL,
  timesheet_type text NOT NULL DEFAULT 'hourly',
  jobsite_id uuid NULL,
  project_name text NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  daily_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_hours numeric(10,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  extra_amount numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_payment numeric(10,2) NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manual_timesheets_period_check CHECK (pay_period_end >= pay_period_start),
  CONSTRAINT manual_timesheets_type_check CHECK (timesheet_type IN ('hourly', 'project'))
);

CREATE INDEX idx_manual_timesheets_company ON public.manual_timesheets(company_id);
CREATE INDEX idx_manual_timesheets_employee ON public.manual_timesheets(employee_id);
CREATE INDEX idx_manual_timesheets_period ON public.manual_timesheets(pay_period_start, pay_period_end);

-- Enable RLS
ALTER TABLE public.manual_timesheets ENABLE ROW LEVEL SECURITY;

-- Admin/Manager-only access scoped by company
CREATE POLICY "Admin/Manager can view manual timesheets in their company"
ON public.manual_timesheets
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND public.is_company_admin()
);

CREATE POLICY "Admin/Manager can insert manual timesheets in their company"
ON public.manual_timesheets
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id()
  AND public.is_company_admin()
  AND created_by = auth.uid()
);

CREATE POLICY "Admin/Manager can update manual timesheets in their company"
ON public.manual_timesheets
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND public.is_company_admin()
)
WITH CHECK (
  company_id = public.get_user_company_id()
  AND public.is_company_admin()
);

CREATE POLICY "Admin/Manager can delete manual timesheets in their company"
ON public.manual_timesheets
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND public.is_company_admin()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_manual_timesheets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_manual_timesheets_updated_at
BEFORE UPDATE ON public.manual_timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_manual_timesheets_updated_at();