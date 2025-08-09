create or replace function public.prevent_early_weekly_timesheet_submission()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_frequency text;
  v_week_ending integer;
  v_period_length integer;
  v_period_end date;
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

  v_period_end := NEW.week_start_date + (v_period_length - 1);

  if current_date <= v_period_end then
    raise exception 'Timesheet cannot be submitted before the period end date (%)', v_period_end;
  end if;

  return NEW;
end;
$$;