-- Drop and recreate the convert_quote_to_invoice function with improved data copying
CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(quote_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    quote_record RECORD;
    new_invoice_id uuid;
    line_item RECORD;
    next_invoice_number text;
BEGIN
    -- Get the quote details
    SELECT * INTO quote_record FROM quotes WHERE id = quote_id_param;
    
    IF quote_record IS NULL THEN
        RAISE EXCEPTION 'Quote not found';
    END IF;
    
    IF quote_record.status != 'accepted' THEN
        RAISE EXCEPTION 'Only accepted quotes can be converted to invoices';
    END IF;

    -- Generate the next invoice number for this company
    SELECT 'INV-' || LPAD(COALESCE(
        (SELECT MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)) + 1
         FROM invoices 
         WHERE company_id = quote_record.company_id 
         AND invoice_number ~ '^INV-[0-9]+$'),
        1
    )::text, 4, '0')
    INTO next_invoice_number;

    -- Create the invoice with all client details
    INSERT INTO invoices (
        invoice_number,
        title,
        client_id,
        client_company,
        client_email,
        client_address,
        client_phone,
        discount,
        tax,
        subtotal,
        total_amount,
        due_date,
        notes,
        company_id,
        status,
        sent_date
    ) VALUES (
        next_invoice_number,
        quote_record.project_name,
        quote_record.client_id,
        COALESCE(quote_record.client_company, quote_record.client_name),
        quote_record.client_email,
        quote_record.client_address,
        quote_record.client_phone,
        quote_record.discount,
        quote_record.tax,
        quote_record.subtotal,
        quote_record.total_amount,
        CURRENT_DATE + INTERVAL '30 days',
        quote_record.notes,
        quote_record.company_id,
        'sent',
        NOW()
    ) RETURNING id INTO new_invoice_id;

    -- Copy line items with quantity and unit_price
    FOR line_item IN SELECT * FROM quote_line_items WHERE quote_id = quote_id_param
    LOOP
        INSERT INTO invoice_line_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            amount
        ) VALUES (
            new_invoice_id,
            line_item.description,
            line_item.quantity,
            line_item.unit_price,
            line_item.amount
        );
    END LOOP;

    -- Update the quote status to invoiced and link to invoice
    UPDATE quotes 
    SET status = 'invoiced', 
        invoice_id = new_invoice_id,
        updated_at = NOW()
    WHERE id = quote_id_param;

    RETURN new_invoice_id;
END;
$$;