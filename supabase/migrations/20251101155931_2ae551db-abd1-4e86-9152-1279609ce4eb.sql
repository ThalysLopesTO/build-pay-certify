-- Create function to permanently delete an employee from the database
CREATE OR REPLACE FUNCTION public.permanently_delete_employee(employee_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  employee_profile record;
  current_user_role text;
  result json;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  -- Check if the current user is an admin or super_admin
  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can permanently delete employees';
  END IF;

  -- Prevent users from deleting themselves
  IF employee_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Get the employee's profile and verify they exist and belong to same company
  SELECT up.*, up.id as profile_id INTO employee_profile
  FROM public.user_profiles up
  WHERE up.user_id = employee_user_id
  AND up.company_id = (
    SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
  );

  -- Check if employee exists and belongs to the same company as the admin
  IF employee_profile IS NULL THEN
    RAISE EXCEPTION 'Employee not found or access denied';
  END IF;

  -- Prevent deletion of super_admin users by non-super_admin
  IF employee_profile.role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can permanently delete super admin users';
  END IF;

  -- Check if employee is already inactive (archived)
  IF employee_profile.is_active = true THEN
    RAISE EXCEPTION 'Employee must be archived before permanent deletion';
  END IF;

  -- Delete employee certificates
  DELETE FROM public.employee_certificates
  WHERE employee_id = employee_user_id;

  -- Remove jobsite foreman assignments
  DELETE FROM public.jobsite_foremen
  WHERE foreman_id = employee_user_id;

  -- Update references in tables to maintain audit trail (set to NULL instead of deleting)
  UPDATE public.daily_reports
  SET submitted_by = NULL
  WHERE submitted_by = employee_user_id;

  UPDATE public.attention_reports
  SET submitted_by = NULL
  WHERE submitted_by = employee_user_id;

  UPDATE public.change_orders
  SET created_by = NULL
  WHERE created_by = employee_user_id;

  -- Delete from user_profiles (this will be done by cascade from auth.users delete)
  -- Delete from auth.users - this is the critical step that removes the authentication account
  DELETE FROM auth.users
  WHERE id = employee_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'deleted_user_id', employee_user_id,
    'deleted_profile_id', employee_profile.profile_id,
    'message', 'Employee permanently deleted from system'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$function$;