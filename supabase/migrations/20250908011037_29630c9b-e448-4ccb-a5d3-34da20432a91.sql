-- Create material_categories table
CREATE TABLE public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for material categories
CREATE POLICY "Company admins can manage material categories"
ON public.material_categories
FOR ALL
USING (
  company_id = get_user_company_id() AND is_company_admin()
);

CREATE POLICY "Company users can view material categories"
ON public.material_categories
FOR SELECT
USING (company_id = get_user_company_id());

-- Create trigger for updated_at
CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON public.material_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_catalog_items_updated_at();

-- Insert default categories for existing companies
INSERT INTO public.material_categories (company_id, name, sort_order, created_by)
SELECT 
  c.id as company_id,
  category_name,
  row_number() OVER (PARTITION BY c.id ORDER BY category_name) as sort_order,
  (SELECT user_id FROM user_profiles WHERE company_id = c.id AND role IN ('admin', 'super_admin') LIMIT 1) as created_by
FROM companies c
CROSS JOIN (
  VALUES 
    ('Drywall'),
    ('Taping'),
    ('Painting'),
    ('Flooring'),
    ('Electrical'),
    ('Plumbing'),
    ('Hardware'),
    ('Lumber'),
    ('Insulation'),
    ('Roofing'),
    ('Windows & Doors'),
    ('HVAC'),
    ('Concrete'),
    ('Tools'),
    ('Safety'),
    ('Other')
) AS default_categories(category_name);