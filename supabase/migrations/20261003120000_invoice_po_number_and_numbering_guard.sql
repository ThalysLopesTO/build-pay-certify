-- Invoices: give the PO its own column, and make numbering collision-proof.
--
-- The invoice form's "PO / Invoice Number" field wrote straight into
-- invoice_number, so two jobs sharing a client PO produced two invoices
-- carrying the same number. The PO now lives in its own column and the
-- number is always generated here.

-- 1. The PO gets its own home
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS po_number text;

COMMENT ON COLUMN public.invoices.po_number IS
  'Client purchase order / reference. Free text, repeats across invoices — never the invoice number.';

-- 2. Generation serialised per company. Without the lock two inserts landing
--    together both read the same MAX and both try the same number; now the
--    second waits for the first to commit. The lock lifts with the transaction.
CREATE OR REPLACE FUNCTION public.generate_invoice_number(company_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext('invoice_number:' || COALESCE(company_id_param::text, 'no-company'))
  );

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE company_id IS NOT DISTINCT FROM company_id_param
    AND invoice_number ~ '^INV-[0-9]+$';

  invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');

  -- Covers numbers typed by hand that already sit on the sequence
  WHILE EXISTS (
    SELECT 1 FROM public.invoices
    WHERE company_id IS NOT DISTINCT FROM company_id_param
      AND invoice_number = invoice_num
  ) LOOP
    next_num := next_num + 1;
    invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;

  RETURN invoice_num;
END;
$function$;

-- 3. The backstop: one number per company, enforced by the database.
--    Added defensively — if numbers are already duplicated the constraint
--    cannot be created, and this reports that instead of aborting the run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.invoices'::regclass
      AND conname = 'invoices_company_id_invoice_number_key'
  ) THEN
    RAISE NOTICE 'Unique constraint already in place.';
  ELSE
    BEGIN
      ALTER TABLE public.invoices
        ADD CONSTRAINT invoices_company_id_invoice_number_key
        UNIQUE (company_id, invoice_number);
      RAISE NOTICE 'Unique constraint created.';
    EXCEPTION WHEN unique_violation THEN
      RAISE WARNING 'NOT created: invoices still hold duplicate numbers. Renumber them, then re-run this block.';
    END;
  END IF;
END $$;

-- 4. The numbering trigger must exist, since the app no longer sends a number.
--    Created only when nothing on the table already runs set_invoice_number().
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'public.invoices'::regclass
      AND NOT t.tgisinternal
      AND p.proname = 'set_invoice_number'
  ) THEN
    RAISE NOTICE 'Numbering trigger already present.';
  ELSE
    CREATE TRIGGER set_invoice_number_trigger
      BEFORE INSERT ON public.invoices
      FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();
    RAISE NOTICE 'Numbering trigger created.';
  END IF;
END $$;

-- 5. Quote conversion numbered invoices from a global sequence, which made a
--    company see its numbers jump (INV-0012 then INV-0301). Same function as
--    before, now asking for the company it is inserting for.
CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(quote_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  quote_record RECORD;
  new_invoice_id uuid;
  new_invoice_number text;
BEGIN
  -- Get the quote with line items
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = quote_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Check if quote is accepted OR client-approved
  IF quote_record.status != 'accepted' AND quote_record.public_status != 'approved' THEN
    RAISE EXCEPTION 'Only accepted or client-approved quotes can be converted to invoices';
  END IF;

  -- Check if already converted
  IF quote_record.invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quote has already been converted to an invoice';
  END IF;

  -- Generate invoice number
  new_invoice_number := public.generate_invoice_number(quote_record.company_id);

  -- Create the invoice (without jobsite_id since quotes don't have that field)
  INSERT INTO public.invoices (
    company_id,
    client_id,
    client_company,
    client_email,
    client_phone,
    client_address,
    title,
    invoice_number,
    due_date,
    subtotal,
    discount,
    tax,
    total_amount,
    notes,
    status
  ) VALUES (
    quote_record.company_id,
    quote_record.client_id,
    quote_record.client_company,
    quote_record.client_email,
    quote_record.client_phone,
    quote_record.client_address,
    quote_record.project_name,
    new_invoice_number,
    CURRENT_DATE + INTERVAL '30 days',
    quote_record.subtotal,
    quote_record.discount,
    quote_record.tax,
    quote_record.total_amount,
    quote_record.notes,
    'pending'
  ) RETURNING id INTO new_invoice_id;

  -- Copy line items
  INSERT INTO public.invoice_line_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    amount
  )
  SELECT 
    new_invoice_id,
    description,
    quantity,
    unit_price,
    amount
  FROM public.quote_line_items
  WHERE quote_id = quote_id_param;

  -- Update quote with invoice reference and set status to converted
  UPDATE public.quotes
  SET 
    invoice_id = new_invoice_id,
    status = 'converted',
    updated_at = now()
  WHERE id = quote_id_param;

  RETURN new_invoice_id;
END;
$function$;


-- Lists whatever is still duplicated, so the result pane says what to fix.
SELECT company_id, invoice_number, count(*) AS duplicates
FROM public.invoices
GROUP BY company_id, invoice_number
HAVING count(*) > 1
ORDER BY duplicates DESC;
