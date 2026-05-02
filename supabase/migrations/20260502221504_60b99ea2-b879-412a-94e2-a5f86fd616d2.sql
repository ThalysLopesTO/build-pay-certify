WITH src AS (
  SELECT w.*, j.name AS jobsite_name
  FROM weekly_timesheets w
  LEFT JOIN jobsites j ON j.id = w.jobsite_id
  WHERE w.company_id = '835de877-4f5d-47e3-85e0-f8d489a66521'
),
flat AS (
  SELECT
    s.company_id,
    COALESCE(NULLIF(s.employee_name,''), NULLIF(s.manual_entry_name,''), 'Unknown') AS employee_name,
    s.worker_type AS employee_role,
    s.jobsite_id,
    COALESCE(s.jobsite_name, 'Unknown Project') AS project_name,
    s.week_start_date AS pay_period_start,
    (s.week_start_date + INTERVAL '6 days')::date AS pay_period_end,
    COALESCE((
      SELECT jsonb_object_agg(kv.k, kv.v)
      FROM jsonb_array_elements(((to_jsonb(s.periods)) -> 0) -> 'days') AS d,
           LATERAL jsonb_each(d) AS kv(k, v)
    ), '{}'::jsonb) AS daily_hours,
    s.total_hours,
    s.hourly_rate,
    COALESCE(s.additional_expense, 0) AS extra_amount,
    (COALESCE(s.hours_pay, 0) + COALESCE(s.additional_expense, 0)) AS subtotal,
    COALESCE(s.tax, 0) AS tax_amount,
    0::numeric AS tax_percent,
    COALESCE(s.total_pay, s.gross_pay, 0) AS total_payment,
    s.notes,
    s.submitted_by AS created_by,
    s.created_at
  FROM src s
)
INSERT INTO manual_timesheets (
  company_id, employee_id, employee_name, employee_role, timesheet_type,
  jobsite_id, project_name, pay_period_start, pay_period_end,
  daily_hours, total_hours, hourly_rate, extra_amount, subtotal,
  tax_amount, tax_percent, total_payment, notes, created_by, created_at, updated_at
)
SELECT
  f.company_id, NULL, f.employee_name, f.employee_role, 'hourly',
  f.jobsite_id, f.project_name, f.pay_period_start, f.pay_period_end,
  f.daily_hours, f.total_hours, f.hourly_rate, f.extra_amount, f.subtotal,
  f.tax_amount, f.tax_percent, f.total_payment, f.notes, f.created_by,
  f.created_at, f.created_at
FROM flat f
WHERE f.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM manual_timesheets m
    WHERE m.company_id = f.company_id
      AND m.created_by = f.created_by
      AND m.pay_period_start = f.pay_period_start
      AND m.employee_name = f.employee_name
      AND m.total_hours = f.total_hours
  );