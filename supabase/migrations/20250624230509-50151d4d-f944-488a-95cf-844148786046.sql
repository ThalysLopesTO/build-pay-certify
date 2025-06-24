
-- Add invoiced status to quotes and create relationship with invoices
ALTER TABLE public.quotes 
ADD COLUMN invoice_id UUID REFERENCES public.invoices(id);

-- Update the status to include 'invoiced' (no constraint check needed)
-- Just add the new column and function

-- Create function to convert quote to invoice
CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(quote_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    quote_record RECORD;
    new_invoice_id UUID;
    line_item RECORD;
BEGIN
    -- Get quote data
    SELECT * INTO quote_record 
    FROM public.quotes 
    WHERE id = quote_id_param 
    AND status != 'invoiced';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found or already converted to invoice';
    END IF;
    
    -- Create invoice
    INSERT INTO public.invoices (
        title,
        client_company,
        client_email,
        jobsite_id,
        discount,
        tax,
        subtotal,
        total_amount,
        due_date,
        notes,
        company_id,
        status
    ) VALUES (
        quote_record.project_name,
        COALESCE(quote_record.client_company, quote_record.client_name),
        quote_record.client_email,
        NULL, -- No jobsite mapping from quotes
        quote_record.discount,
        quote_record.tax,
        quote_record.subtotal,
        quote_record.total_amount,
        CURRENT_DATE + INTERVAL '30 days', -- Default 30 days due date
        quote_record.notes,
        quote_record.company_id,
        'pending'
    ) RETURNING id INTO new_invoice_id;
    
    -- Copy line items
    FOR line_item IN 
        SELECT * FROM public.quote_line_items 
        WHERE quote_id = quote_id_param
    LOOP
        INSERT INTO public.invoice_line_items (
            invoice_id,
            description,
            amount
        ) VALUES (
            new_invoice_id,
            line_item.description,
            line_item.amount
        );
    END LOOP;
    
    -- Update quote status and link to invoice
    UPDATE public.quotes 
    SET 
        status = 'invoiced',
        invoice_id = new_invoice_id,
        updated_at = NOW()
    WHERE id = quote_id_param;
    
    RETURN new_invoice_id;
END;
$$;
