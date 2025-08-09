-- Guard: prevent early weekly_timesheets submission before period end
-- Create or replace function and trigger
create or replace function public.prevent_early_weekly_timesheet_submission()
returns trigger as $$
begin
  -- Fetch company settings
  declare v_frequency text;
  declare v_week_ending integer;
  declare v_period_length integer;
  declare v_period_end date;
begin
  select timesheet_frequency, coalesce(week_ending_day, 0)
    into v_frequency, v_week_ending
  from public.company_settings
  where company_id = NEW.company_id
  order by created_at desc
  limit 1;

  if v_frequency is null then
    v_frequency := 'weekly';
  end if;

  v_period_length := case when v_frequency = 'bi-weekly' then 14 else 7 end;

  -- Assume week_start_date already aligned to the start of period
  v_period_end := NEW.week_start_date + (v_period_length - 1);

  -- Block inserts until the day after period end (local midnight approximation using server date)
  if current_date <= v_period_end then
    raise exception 'Timesheet cannot be submitted before the period end date (%)', v_period_end;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists, then create
drop trigger if exists trg_prevent_early_weekly_timesheet_submission on public.weekly_timesheets;
create trigger trg_prevent_early_weekly_timesheet_submission
before insert on public.weekly_timesheets
for each row
execute function public.prevent_early_weekly_timesheet_submission();