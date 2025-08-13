-- Fix search path for the prevent_self_approval_timesheet function
CREATE OR REPLACE FUNCTION public.prevent_self_approval_timesheet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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