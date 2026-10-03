-- Weekly Schedule: the crew moves onto the day.
--
-- A sheet used to belong to one employee, and several employees meant several
-- copies of the same week. Now a sheet is the company's week and each day
-- carries the crew that works it, so a job is written once. An employee reads
-- only the days they are on, through the RPC below.

-- 1. Existing per-employee sheets keep working: their owner becomes the crew
--    of every day on that sheet.
UPDATE public.weekly_schedules ws
SET entries = (
  SELECT jsonb_agg(
           CASE
             WHEN jsonb_typeof(e -> 'employee_ids') = 'array'
              AND jsonb_array_length(e -> 'employee_ids') > 0
               THEN e
             ELSE jsonb_set(
                    jsonb_set(e, '{employee_ids}', jsonb_build_array(ws.assignee_user_id::text), true),
                    '{employee_names}', jsonb_build_array(COALESCE(ws.assignee_name, '')), true
                  )
           END
           ORDER BY e ->> 'date'
         )
  FROM jsonb_array_elements(ws.entries) e
)
WHERE ws.assignee_user_id IS NOT NULL
  AND jsonb_typeof(ws.entries) = 'array'
  AND jsonb_array_length(ws.entries) > 0;

-- 2. Employees no longer read the table directly — the week holds everyone's
--    jobs, and they have no business seeing the rest of it.
DROP POLICY IF EXISTS "Schedulers and assignees can view weekly schedules" ON public.weekly_schedules;

CREATE POLICY "Schedulers can view weekly schedules"
ON public.weekly_schedules FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id_safe()
  AND public.can_manage_weekly_schedules()
);

-- 3. What an employee gets: their own days of a published week, nothing else.
CREATE OR REPLACE FUNCTION public.get_my_weekly_schedule(p_week_start date)
RETURNS TABLE (
  id uuid,
  week_start date,
  title text,
  notes text,
  entries jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ws.id,
    ws.week_start,
    ws.assignee_name AS title,
    ws.notes,
    COALESCE(
      (
        SELECT jsonb_agg(e ORDER BY e ->> 'date')
        FROM jsonb_array_elements(ws.entries) e
        WHERE e -> 'employee_ids' ? auth.uid()::text
      ),
      '[]'::jsonb
    ) AS entries
  FROM public.weekly_schedules ws
  WHERE ws.week_start = p_week_start
    AND ws.status = 'published'
    AND ws.company_id = public.get_user_company_id_safe()
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(ws.entries) e
      WHERE e -> 'employee_ids' ? auth.uid()::text
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_weekly_schedule(date) TO authenticated;

-- 4. One sheet per employee per week was the old shape; a week now holds one
--    sheet for everybody, so that constraint no longer describes anything.
DROP INDEX IF EXISTS public.idx_weekly_schedules_unique_assignee_week;
