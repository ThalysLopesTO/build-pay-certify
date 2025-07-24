-- Update delete_employee function to allow management role
CREATE OR REPLACE FUNCTION public.delete_employee(employee_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  employee_profile record;
  result json;
BEGIN
  -- Check if the current user is an admin, super_admin, or management
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins and managers can delete employees';
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

  -- Prevent deletion of super_admin or admin users by non-super_admin
  IF employee_profile.role IN ('admin', 'super_admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Only super admins can delete admin users';
    END IF;
  END IF;

  -- Soft delete: Set is_active to false instead of deleting
  UPDATE public.user_profiles 
  SET 
    is_active = false,
    updated_at = now()
  WHERE user_id = employee_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'archived_user_id', employee_user_id,
    'archived_profile_id', employee_profile.profile_id
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
$function$