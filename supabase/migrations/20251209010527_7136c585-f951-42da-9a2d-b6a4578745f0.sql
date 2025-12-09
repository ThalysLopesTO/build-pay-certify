-- Add discount_type column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed' 
CHECK (discount_type IN ('percentage', 'fixed'));