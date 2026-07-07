-- 1. Drop the global unique constraint on invoice_number
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- 2. Add a per-company unique constraint
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_company_id_invoice_number_key
  UNIQUE (company_id, invoice_number);

-- 3. Scope the auto-generator to the company
CREATE OR REPLACE FUNCTION public.generate_invoice_number(company_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE company_id = company_id_param
    AND invoice_number ~ '^INV-[0-9]+$';

  invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');

  WHILE EXISTS (
    SELECT 1 FROM public.invoices
    WHERE company_id = company_id_param AND invoice_number = invoice_num
  ) LOOP
    next_num := next_num + 1;
    invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;

  RETURN invoice_num;
END;
$function$;

-- 4. Scope the trigger's duplicate check + generation to the company
CREATE OR REPLACE FUNCTION public.set_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE company_id = NEW.company_id
        AND invoice_number = NEW.invoice_number
    ) THEN
      RAISE EXCEPTION 'Invoice number % already exists', NEW.invoice_number;
    END IF;
  ELSE
    NEW.invoice_number := public.generate_invoice_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$function$;
