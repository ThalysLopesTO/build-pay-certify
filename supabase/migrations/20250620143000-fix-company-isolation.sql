
-- Fix the handle_new_user trigger to NOT automatically assign companies
-- This prevents new users from being assigned to random existing companies

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only create a profile if company_id is provided in metadata
  -- This prevents automatic assignment to random companies
  IF NEW.raw_user_meta_data ->> 'company_id' IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      user_id, 
      company_id, 
      role,
      first_name, 
      last_name
    ) VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'company_id')::UUID,
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee'),
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
  END IF;
  
  RETURN NEW;
END;
$$;
