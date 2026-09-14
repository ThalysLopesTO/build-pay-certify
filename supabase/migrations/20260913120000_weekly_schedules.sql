-- Weekly Schedule (7 Star Family)
-- One row = one employee/team's week. `entries` holds the 7 day rows of the
-- schedule sheet (client/job site, start time, address, service, notes), so the
-- saved history answers "where was this crew on that day, for which client".

CREATE TABLE public.weekly_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  week_start date NOT NULL,                 -- always the Monday of the week
  assignee_user_id uuid NULL,               -- user_profiles.user_id when it's an employee
  assignee_name text NOT NULL DEFAULT '',   -- employee name or free-text team name
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NULL,
  status text NOT NULL DEFAULT 'draft',     -- draft | published
  published_at timestamptz NULL,
  created_by uuid NOT NULL,
  created_by_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Who may build schedules: admins, management and foremen (crew leaders).
-- Employees only ever read their own row (see the SELECT policy below).
CREATE OR REPLACE FUNCTION public.can_manage_weekly_schedules()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.get_current_user_role() IN ('super_admin', 'admin', 'management', 'foreman'),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_weekly_schedules() TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_schedules TO authenticated;
GRANT ALL ON public.weekly_schedules TO service_role;

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Schedulers see every schedule in the company; an employee sees only their own,
-- and only once it has been published.
CREATE POLICY "Schedulers and assignees can view weekly schedules"
ON public.weekly_schedules FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id_safe()
  AND (
    public.can_manage_weekly_schedules()
    OR (assignee_user_id = auth.uid() AND status = 'published')
  )
);

CREATE POLICY "Schedulers can create weekly schedules"
ON public.weekly_schedules FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id_safe()
  AND created_by = auth.uid()
  AND public.can_manage_weekly_schedules()
);

CREATE POLICY "Schedulers can update weekly schedules"
ON public.weekly_schedules FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id_safe() AND public.can_manage_weekly_schedules())
WITH CHECK (company_id = public.get_user_company_id_safe() AND public.can_manage_weekly_schedules());

CREATE POLICY "Schedulers can delete weekly schedules"
ON public.weekly_schedules FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id_safe() AND public.can_manage_weekly_schedules());

-- One schedule per employee per week; team rows (no user link) are unconstrained.
CREATE UNIQUE INDEX idx_weekly_schedules_unique_assignee_week
ON public.weekly_schedules (company_id, week_start, assignee_user_id)
WHERE assignee_user_id IS NOT NULL;

CREATE INDEX idx_weekly_schedules_company_week
ON public.weekly_schedules (company_id, week_start DESC);

CREATE INDEX idx_weekly_schedules_assignee
ON public.weekly_schedules (assignee_user_id, week_start DESC);

CREATE TRIGGER update_weekly_schedules_updated_at
BEFORE UPDATE ON public.weekly_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
