-- Create material takeoffs table with optimizations
CREATE TABLE public.material_takeoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id),
  company_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  total_qty_estimated NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS (total_qty_estimated * unit_price) STORED,
  requested_qty NUMERIC NOT NULL DEFAULT 0,
  remaining_qty NUMERIC GENERATED ALWAYS AS (total_qty_estimated - requested_qty) STORED,
  status TEXT NOT NULL DEFAULT 'not_requested' CHECK (status IN ('not_requested', 'partially_requested', 'fully_requested')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  -- Add additional fields for enhanced functionality
  vendor TEXT,
  notes TEXT,
  category TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  is_draft BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.material_takeoffs ENABLE ROW LEVEL SECURITY;

-- Users can view takeoffs for their company
CREATE POLICY "Users can view takeoffs for their company" 
  ON public.material_takeoffs 
  FOR SELECT 
  USING (
    company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid()
    )
  );

-- Admins can manage takeoffs for their company
CREATE POLICY "Admins can manage takeoffs for their company" 
  ON public.material_takeoffs 
  FOR ALL 
  USING (
    company_id IN (
      SELECT user_profiles.company_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for optimal performance
CREATE INDEX idx_material_takeoffs_company_jobsite ON public.material_takeoffs(company_id, jobsite_id);
CREATE INDEX idx_material_takeoffs_material_name ON public.material_takeoffs(material_name);
CREATE INDEX idx_material_takeoffs_status ON public.material_takeoffs(status);
CREATE INDEX idx_material_takeoffs_created_at ON public.material_takeoffs(created_at);
CREATE INDEX idx_material_takeoffs_category ON public.material_takeoffs(category);
CREATE INDEX idx_material_takeoffs_draft ON public.material_takeoffs(is_draft);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_material_takeoff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_material_takeoffs_updated_at
BEFORE UPDATE ON public.material_takeoffs
FOR EACH ROW
EXECUTE FUNCTION public.update_material_takeoff_updated_at();