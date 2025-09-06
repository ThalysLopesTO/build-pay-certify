-- Create material catalog items table
CREATE TABLE public.material_catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  spec_size TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  category TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Add constraints
ALTER TABLE public.material_catalog_items 
ADD CONSTRAINT unique_name_spec_per_company 
UNIQUE (company_id, name, spec_size);

-- Add conditional unique constraint for SKU (only when not null)
CREATE UNIQUE INDEX unique_sku_per_company 
ON public.material_catalog_items (company_id, sku) 
WHERE sku IS NOT NULL;

-- Enable RLS
ALTER TABLE public.material_catalog_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for material catalog items
CREATE POLICY "Company admins can manage material catalog" 
ON public.material_catalog_items 
FOR ALL 
USING (
  company_id = get_user_company_id() AND 
  is_company_admin()
);

CREATE POLICY "Company users can view material catalog" 
ON public.material_catalog_items 
FOR SELECT 
USING (company_id = get_user_company_id());

-- Create material request line items table
CREATE TABLE public.material_request_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_request_id UUID NOT NULL,
  catalog_item_id UUID,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  material_name TEXT NOT NULL,
  spec_override TEXT,
  notes TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  line_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.material_request_line_items 
ADD CONSTRAINT fk_material_request 
FOREIGN KEY (material_request_id) 
REFERENCES public.material_requests(id) 
ON DELETE CASCADE;

ALTER TABLE public.material_request_line_items 
ADD CONSTRAINT fk_catalog_item 
FOREIGN KEY (catalog_item_id) 
REFERENCES public.material_catalog_items(id) 
ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_material_request_line_items_request_id 
ON public.material_request_line_items(material_request_id);

CREATE INDEX idx_material_request_line_items_catalog_item_id 
ON public.material_request_line_items(catalog_item_id);

-- Enable RLS
ALTER TABLE public.material_request_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for line items
CREATE POLICY "Users can manage line items for their company requests" 
ON public.material_request_line_items 
FOR ALL 
USING (
  material_request_id IN (
    SELECT id FROM public.material_requests 
    WHERE company_id = get_user_company_id()
  )
);

-- Add has_line_items column to material_requests for backward compatibility
ALTER TABLE public.material_requests 
ADD COLUMN has_line_items BOOLEAN NOT NULL DEFAULT false;

-- Create trigger to update updated_at for material catalog items
CREATE OR REPLACE FUNCTION public.update_material_catalog_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_material_catalog_items_updated_at
  BEFORE UPDATE ON public.material_catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_catalog_items_updated_at();