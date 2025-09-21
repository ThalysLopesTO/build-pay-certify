-- Add order_type field to change_orders table
ALTER TABLE public.change_orders 
ADD COLUMN order_type text NOT NULL DEFAULT 'change';

-- Add check constraint for valid order types
ALTER TABLE public.change_orders 
ADD CONSTRAINT check_order_type CHECK (order_type IN ('change', 'extra'));