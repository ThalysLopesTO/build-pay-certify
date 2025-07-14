-- Allow null values for expiry_date in employee_certificates table to support certificates that never expire
ALTER TABLE public.employee_certificates 
ALTER COLUMN expiry_date DROP NOT NULL;

-- Update the certificate status trigger to handle null expiry dates
CREATE OR REPLACE FUNCTION public.update_certificate_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate status based on expiry date
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'valid';  -- Never expires, always valid
  ELSIF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring';
  ELSE
    NEW.status := 'valid';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;