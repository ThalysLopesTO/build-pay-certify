
-- Create a function to handle new company creation
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_rule_content TEXT;
BEGIN
  -- Fetch the latest default rule content
  SELECT content INTO default_rule_content
  FROM public.default_rules
  ORDER BY created_at DESC
  LIMIT 1;

  -- Insert new company_settings record with default rules
  INSERT INTO public.company_settings (
    company_id,
    company_name,
    company_rules_text
  ) VALUES (
    NEW.id,
    NEW.name,
    default_rule_content
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block company creation
    RAISE WARNING 'Failed to create company_settings for company %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to execute the function after company insert
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();
