
-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT,
  license_plate TEXT,
  vin TEXT,
  jobsite_id UUID REFERENCES public.jobsites(id),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for company isolation
CREATE POLICY "Users can only access vehicles from their company" 
  ON public.vehicles 
  FOR ALL
  USING (company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Add indexes for better performance
CREATE INDEX idx_vehicles_company_id ON public.vehicles(company_id);
CREATE INDEX idx_vehicles_jobsite_id ON public.vehicles(jobsite_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
