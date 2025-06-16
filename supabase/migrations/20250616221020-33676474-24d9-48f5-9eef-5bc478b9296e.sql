
-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone_number TEXT,
  email TEXT,
  supplier_type TEXT,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company-based access
CREATE POLICY "Users can view suppliers from their company" 
  ON public.suppliers 
  FOR SELECT 
  USING (company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Admin users can insert suppliers
CREATE POLICY "Admins can insert suppliers" 
  ON public.suppliers 
  FOR INSERT 
  WITH CHECK (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Admin users can update suppliers
CREATE POLICY "Admins can update suppliers" 
  ON public.suppliers 
  FOR UPDATE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Admin users can delete suppliers
CREATE POLICY "Admins can delete suppliers" 
  ON public.suppliers 
  FOR DELETE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX idx_suppliers_supplier_type ON public.suppliers(supplier_type);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suppliers_updated_at();
