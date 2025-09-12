-- Update is_company_admin function to include management role
CREATE OR REPLACE FUNCTION public.is_company_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role IN ('super_admin', 'admin', 'management') FROM public.user_profiles WHERE user_id = auth.uid();
$function$;