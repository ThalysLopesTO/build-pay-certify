
-- Drop the existing function if it exists and recreate it with proper visibility
DROP FUNCTION IF EXISTS public.delete_employee(UUID);

-- Create the delete_employee function with corrected logic
CREATE OR REPLACE FUNCTION public.delete_employee(employee_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_profile record;
  result json;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete employees';
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

  -- Delete the user profile (this will be the main deletion)
  -- Note: We're NOT deleting timesheets, certificates, or payroll history as requested
  DELETE FROM public.user_profiles WHERE user_id = employee_user_id;

  -- Delete from auth.users to revoke access completely
  -- This requires elevated privileges and will prevent login
  DELETE FROM auth.users WHERE id = employee_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'deleted_user_id', employee_user_id,
    'deleted_profile_id', employee_profile.profile_id
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
$$;

-- Grant execute permission to authenticated users (function will handle authorization internally)
GRANT EXECUTE ON FUNCTION public.delete_employee(UUID) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.delete_employee(UUID) IS 'Deletes an employee user while preserving historical data like timesheets and certificates. Only admins can execute this function.';
