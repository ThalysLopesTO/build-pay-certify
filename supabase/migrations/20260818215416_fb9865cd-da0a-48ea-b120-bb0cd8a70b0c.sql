CREATE TABLE public.site_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  jobsite_id uuid,
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  client_name text,
  insurance_company text,
  adjuster text,
  claim_number text,
  job_number text,
  property_address text,
  supervisor text,
  crew_members text,
  builder_company text,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_control jsonb NOT NULL DEFAULT '{}'::jsonb,
  comments text,
  signatures jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_inspections TO authenticated;
GRANT ALL ON public.site_inspections TO service_role;

ALTER TABLE public.site_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view site inspections"
ON public.site_inspections FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id_safe());

CREATE POLICY "Company members can create site inspections"
ON public.site_inspections FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id_safe() AND created_by = auth.uid());

CREATE POLICY "Company members can update site inspections"
ON public.site_inspections FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id_safe())
WITH CHECK (company_id = public.get_user_company_id_safe());

CREATE POLICY "Company members can delete site inspections"
ON public.site_inspections FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id_safe());

CREATE TABLE public.site_inspection_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id uuid NOT NULL REFERENCES public.site_inspections(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_inspection_photos TO authenticated;
GRANT ALL ON public.site_inspection_photos TO service_role;

ALTER TABLE public.site_inspection_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view inspection photos"
ON public.site_inspection_photos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.site_inspections si WHERE si.id = inspection_id AND si.company_id = public.get_user_company_id_safe()));

CREATE POLICY "Company members can add inspection photos"
ON public.site_inspection_photos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.site_inspections si WHERE si.id = inspection_id AND si.company_id = public.get_user_company_id_safe()));

CREATE POLICY "Company members can update inspection photos"
ON public.site_inspection_photos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.site_inspections si WHERE si.id = inspection_id AND si.company_id = public.get_user_company_id_safe()))
WITH CHECK (EXISTS (SELECT 1 FROM public.site_inspections si WHERE si.id = inspection_id AND si.company_id = public.get_user_company_id_safe()));

CREATE POLICY "Company members can delete inspection photos"
ON public.site_inspection_photos FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.site_inspections si WHERE si.id = inspection_id AND si.company_id = public.get_user_company_id_safe()));

CREATE TRIGGER update_site_inspections_updated_at
BEFORE UPDATE ON public.site_inspections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_site_inspections_company_date ON public.site_inspections (company_id, inspection_date DESC);
CREATE INDEX idx_site_inspection_photos_inspection ON public.site_inspection_photos (inspection_id);