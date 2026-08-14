CREATE TABLE public.daily_sheets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  jobsite_id uuid NULL,
  project_name text NOT NULL DEFAULT '',
  sheet_date date NOT NULL,
  crew jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_hours numeric NOT NULL DEFAULT 0,
  notes text NULL,
  job_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_by_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_sheets TO authenticated;
GRANT ALL ON public.daily_sheets TO service_role;

ALTER TABLE public.daily_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view daily sheets"
ON public.daily_sheets FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id_safe());

CREATE POLICY "Company members can create daily sheets"
ON public.daily_sheets FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id_safe() AND created_by = auth.uid());

CREATE POLICY "Company members can update daily sheets"
ON public.daily_sheets FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id_safe())
WITH CHECK (company_id = public.get_user_company_id_safe());

CREATE POLICY "Company members can delete daily sheets"
ON public.daily_sheets FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id_safe());

CREATE INDEX idx_daily_sheets_company_date ON public.daily_sheets (company_id, sheet_date DESC);

CREATE TRIGGER update_daily_sheets_updated_at
BEFORE UPDATE ON public.daily_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();