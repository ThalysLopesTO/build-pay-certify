-- Add function to prevent self-approval of timesheets
CREATE OR REPLACE FUNCTION public.prevent_self_approval_timesheet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- If this is an approval action (status change to 'approved')
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check if the person approving is the same as the person who submitted the timesheet
    IF NEW.updated_by = NEW.user_id OR NEW.updated_by = NEW.submitted_by THEN
      RAISE EXCEPTION 'Users cannot approve their own timesheets. Please have another manager or administrator approve this timesheet.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for weekly_timesheets table
DROP TRIGGER IF EXISTS prevent_self_approval_weekly_timesheets ON public.weekly_timesheets;
CREATE TRIGGER prevent_self_approval_weekly_timesheets
  BEFORE UPDATE ON public.weekly_timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_approval_timesheet();

-- Also add a column to track who updated the timesheet if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'weekly_timesheets' 
                 AND column_name = 'updated_by' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.weekly_timesheets ADD COLUMN updated_by UUID;
  END IF;
END $$;