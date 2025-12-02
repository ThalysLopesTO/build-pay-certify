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
  new_invoice_number := public.generate_invoice_number();

  -- Create the invoice
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
    status,
    jobsite_id
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
    'pending',
    quote_record.jobsite_id
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