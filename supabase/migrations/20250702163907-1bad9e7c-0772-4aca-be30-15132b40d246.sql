
-- Drop existing material_takeoffs table and create a simplified version
DROP TABLE IF EXISTS public.material_takeoffs CASCADE;

-- Create simplified material_takeoff_notes table
CREATE TABLE public.material_takeoff_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  takeoff_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID,
  -- Ensure one takeoff per jobsite
  UNIQUE(jobsite_id, company_id)
);

-- Enable Row Level Security
ALTER TABLE public.material_takeoff_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage material takeoff notes
CREATE POLICY "Admins can manage takeoff notes for their company" 
ON public.material_takeoff_notes 
FOR ALL 
USING (
  company_id IN ( 
    SELECT user_profiles.company_id
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

-- Create indexes for performance
CREATE INDEX idx_material_takeoff_notes_company_jobsite ON public.material_takeoff_notes(company_id, jobsite_id);
CREATE INDEX idx_material_takeoff_notes_created_at ON public.material_takeoff_notes(created_at);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_material_takeoff_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_material_takeoff_notes_updated_at
BEFORE UPDATE ON public.material_takeoff_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_material_takeoff_notes_updated_at();

-- Drop the old paginated function since we're changing the structure completely
DROP FUNCTION IF EXISTS public.get_material_takeoffs_paginated(uuid,uuid,text,text,text,integer,integer);

-- Create new function for getting takeoff notes with jobsite info
CREATE OR REPLACE FUNCTION public.get_material_takeoff_notes(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  jobsite_id uuid,
  company_id uuid,
  takeoff_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  updated_by uuid,
  jobsite_name text,
  jobsite_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mtn.id,
    mtn.jobsite_id,
    mtn.company_id,
    mtn.takeoff_notes,
    mtn.created_at,
    mtn.updated_at,
    mtn.created_by,
    mtn.updated_by,
    j.name as jobsite_name,
    j.address as jobsite_address
  FROM public.material_takeoff_notes mtn
  LEFT JOIN public.jobsites j ON j.id = mtn.jobsite_id
  WHERE mtn.company_id = p_company_id
  ORDER BY mtn.updated_at DESC;
END;
$$;

-- Drop old bulk functions that are no longer needed
DROP FUNCTION IF EXISTS public.bulk_insert_material_takeoffs(jsonb);
DROP FUNCTION IF EXISTS public.bulk_update_material_takeoffs(uuid[], jsonb);
DROP FUNCTION IF EXISTS public.bulk_delete_material_takeoffs(uuid[]);
