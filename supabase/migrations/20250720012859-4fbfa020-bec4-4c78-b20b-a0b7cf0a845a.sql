-- Update the get_company_employee_count function to only count active employees
CREATE OR REPLACE FUNCTION public.get_company_employee_count(company_id_param uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.user_profiles 
  WHERE company_id = company_id_param 
  AND role IN ('employee', 'foreman', 'admin', 'payroll')
  AND is_active = true;
$function$;