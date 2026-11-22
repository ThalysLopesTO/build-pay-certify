-- Material takeoff list: one row per material on a jobsite's takeoff.
-- Items are picked from the Material Catalog (catalog_item_id) or typed in
-- as custom items (catalog_item_id NULL). The name/unit/size are copied onto
-- the row so the takeoff keeps reading the same if the catalog item is later
-- renamed or deleted. The free-text notes stay in material_takeoff_notes.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.material_takeoff_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.material_catalog_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 300),
  sku TEXT,
  spec_size TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  category_name TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_takeoff_items_company_jobsite
  ON public.material_takeoff_items(company_id, jobsite_id, sort_order);

ALTER TABLE public.material_takeoff_items ENABLE ROW LEVEL SECURITY;

-- Same access as the takeoff notes: admins of the company.
DROP POLICY IF EXISTS "Admins can manage takeoff items for their company" ON public.material_takeoff_items;
CREATE POLICY "Admins can manage takeoff items for their company"
ON public.material_takeoff_items
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT up.company_id FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
)
WITH CHECK (
  company_id IN (
    SELECT up.company_id FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
  -- the jobsite must belong to the same company
  AND EXISTS (
    SELECT 1 FROM public.jobsites j
    WHERE j.id = jobsite_id AND j.company_id = material_takeoff_items.company_id
  )
);

CREATE OR REPLACE FUNCTION public.update_material_takeoff_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_material_takeoff_items_updated_at ON public.material_takeoff_items;
CREATE TRIGGER update_material_takeoff_items_updated_at
BEFORE UPDATE ON public.material_takeoff_items
FOR EACH ROW
EXECUTE FUNCTION public.update_material_takeoff_items_updated_at();
