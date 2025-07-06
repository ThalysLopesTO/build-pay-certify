-- Add quantity and unit_price fields to invoice_line_items table
ALTER TABLE public.invoice_line_items 
ADD COLUMN quantity INTEGER DEFAULT 1,
ADD COLUMN unit_price NUMERIC DEFAULT 0;

-- Update existing line items to have default values
UPDATE public.invoice_line_items 
SET quantity = 1, unit_price = amount 
WHERE quantity IS NULL OR unit_price IS NULL;