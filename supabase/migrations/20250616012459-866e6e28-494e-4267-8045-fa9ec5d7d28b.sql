
-- Create inventory table with proper structure and relationships
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  sku TEXT NOT NULL,
  start_date DATE NOT NULL,
  return_date DATE,
  created_by UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company-based access
CREATE POLICY "Users can view inventory from their company" 
  ON public.inventory 
  FOR SELECT 
  USING (company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Admin users can insert inventory
CREATE POLICY "Admins can insert inventory" 
  ON public.inventory 
  FOR INSERT 
  WITH CHECK (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Admin users can update inventory
CREATE POLICY "Admins can update inventory" 
  ON public.inventory 
  FOR UPDATE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Admin users can delete inventory
CREATE POLICY "Admins can delete inventory" 
  ON public.inventory 
  FOR DELETE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX idx_inventory_jobsite_id ON public.inventory(jobsite_id);
CREATE INDEX idx_inventory_created_by ON public.inventory(created_by);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();
