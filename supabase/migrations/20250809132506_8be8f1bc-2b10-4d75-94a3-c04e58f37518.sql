-- Ensure timezone column exists (default can be adjusted later in UI)
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Toronto';

create or replace function public.prevent_early_weekly_timesheet_submission()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_frequency text;
  v_week_ending int;
  v_period_length int;
  v_period_end date;
  v_tz text;
  v_today_local date;
begin
  select timesheet_frequency, coalesce(week_ending_day, 0), timezone
    into v_frequency, v_week_ending, v_tz
  from public.company_settings
  where company_id = NEW.company_id
  limit 1;

  if v_frequency is null then v_frequency := 'weekly'; end if;
  v_period_length := case when v_frequency = 'bi-weekly' then 14 else 7 end;

  -- week_start_date is aligned; end = start + (length - 1)
  v_period_end := NEW.week_start_date + (v_period_length - 1);

  -- local date in company timezone
  v_today_local := (now() at time zone v_tz)::date;

  -- OPEN at 00:00 local on end date (>= instead of >)
  if v_today_local < v_period_end then
    raise exception 'Timesheet cannot be submitted before the period end date (%)', v_period_end;
  end if;

  return NEW;
end;
$$;

-- Triggers: INSERT and status-change UPDATE
DROP TRIGGER IF EXISTS trg_prevent_early_weekly_timesheet_insert ON public.weekly_timesheets;
CREATE TRIGGER trg_prevent_early_weekly_timesheet_insert
BEFORE INSERT ON public.weekly_timesheets
FOR EACH ROW
EXECUTE FUNCTION public.prevent_early_weekly_timesheet_submission();

DROP TRIGGER IF EXISTS trg_prevent_early_weekly_timesheet_update ON public.weekly_timesheets;
CREATE TRIGGER trg_prevent_early_weekly_timesheet_update
BEFORE UPDATE ON public.weekly_timesheets
FOR EACH ROW
WHEN (NEW.status = 'submitted' and OLD.status is distinct from 'submitted')
EXECUTE FUNCTION public.prevent_early_weekly_timesheet_submission();