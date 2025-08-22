-- Create trigger function to automatically calculate weekly timesheet totals
CREATE OR REPLACE FUNCTION public.calculate_weekly_timesheet_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total hours from daily hours
  NEW.total_hours := COALESCE(NEW.monday_hours, 0) + 
                     COALESCE(NEW.tuesday_hours, 0) + 
                     COALESCE(NEW.wednesday_hours, 0) + 
                     COALESCE(NEW.thursday_hours, 0) + 
                     COALESCE(NEW.friday_hours, 0) + 
                     COALESCE(NEW.saturday_hours, 0) + 
                     COALESCE(NEW.sunday_hours, 0);
  
  -- Calculate gross pay (including additional expenses)
  NEW.gross_pay := (NEW.total_hours * COALESCE(NEW.hourly_rate, 0)) + COALESCE(NEW.additional_expense, 0);
  
  -- Update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on weekly_timesheets table
DROP TRIGGER IF EXISTS trigger_calculate_weekly_timesheet_totals ON public.weekly_timesheets;
CREATE TRIGGER trigger_calculate_weekly_timesheet_totals
  BEFORE INSERT OR UPDATE ON public.weekly_timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_weekly_timesheet_totals();