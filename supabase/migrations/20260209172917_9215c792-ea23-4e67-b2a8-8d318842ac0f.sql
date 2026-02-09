
-- Fix generate_invoice_number to use MAX instead of COUNT
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';

  invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = invoice_num) LOOP
    next_num := next_num + 1;
    invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Update set_invoice_number trigger to accept provided invoice numbers
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    IF EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = NEW.invoice_number) THEN
      RAISE EXCEPTION 'Invoice number % already exists', NEW.invoice_number;
    END IF;
  ELSE
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
