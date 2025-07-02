
-- Create material takeoffs table for each project
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
  created_by UUID NOT NULL
);

-- Create junction table to link material requests to takeoff items
CREATE TABLE public.material_takeoff_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_request_id UUID NOT NULL REFERENCES public.material_requests(id),
  material_takeoff_id UUID REFERENCES public.material_takeoffs(id),
  requested_qty NUMERIC NOT NULL DEFAULT 0,
  is_unplanned BOOLEAN NOT NULL DEFAULT false,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for material takeoffs
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

-- Add RLS policies for material takeoff requests
ALTER TABLE public.material_takeoff_requests ENABLE ROW LEVEL SECURITY;

-- Users can view takeoff requests for their company
CREATE POLICY "Users can view takeoff requests for their company" 
  ON public.material_takeoff_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM material_requests mr
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE mr.id = material_takeoff_requests.material_request_id
      AND mr.company_id = up.company_id
    )
  );

-- Users can create takeoff requests
CREATE POLICY "Users can create takeoff requests" 
  ON public.material_takeoff_requests 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM material_requests mr
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE mr.id = material_takeoff_requests.material_request_id
      AND mr.company_id = up.company_id
    )
  );

-- Admins can manage takeoff requests for their company
CREATE POLICY "Admins can manage takeoff requests for their company" 
  ON public.material_takeoff_requests 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM material_requests mr
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE mr.id = material_takeoff_requests.material_request_id
      AND mr.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin')
    )
  );

-- Create function to update takeoff quantities and status
CREATE OR REPLACE FUNCTION public.update_material_takeoff_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the takeoff quantities and status
  UPDATE public.material_takeoffs
  SET 
    requested_qty = COALESCE((
      SELECT SUM(requested_qty) 
      FROM public.material_takeoff_requests 
      WHERE material_takeoff_id = NEW.material_takeoff_id
      AND is_unplanned = false
    ), 0),
    status = CASE 
      WHEN COALESCE((
        SELECT SUM(requested_qty) 
        FROM public.material_takeoff_requests 
        WHERE material_takeoff_id = NEW.material_takeoff_id
        AND is_unplanned = false
      ), 0) = 0 THEN 'not_requested'
      WHEN COALESCE((
        SELECT SUM(requested_qty) 
        FROM public.material_takeoff_requests 
        WHERE material_takeoff_id = NEW.material_takeoff_id
        AND is_unplanned = false
      ), 0) >= total_qty_estimated THEN 'fully_requested'
      ELSE 'partially_requested'
    END,
    updated_at = now()
  WHERE id = NEW.material_takeoff_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update takeoff status
CREATE TRIGGER update_takeoff_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.material_takeoff_requests
  FOR EACH ROW
  WHEN (NEW.material_takeoff_id IS NOT NULL OR OLD.material_takeoff_id IS NOT NULL)
  EXECUTE FUNCTION public.update_material_takeoff_status();

-- Add indexes for better performance
CREATE INDEX idx_material_takeoffs_jobsite_company ON public.material_takeoffs(jobsite_id, company_id);
CREATE INDEX idx_material_takeoff_requests_takeoff_id ON public.material_takeoff_requests(material_takeoff_id);
CREATE INDEX idx_material_takeoff_requests_request_id ON public.material_takeoff_requests(material_request_id);
