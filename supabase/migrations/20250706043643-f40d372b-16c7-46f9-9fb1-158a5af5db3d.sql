-- Add client address and phone fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN client_address TEXT,
ADD COLUMN client_phone TEXT;

-- Update existing invoices to remove jobsite dependency (optional, can be done gradually)
-- Note: jobsite_id will remain as nullable for backward compatibility