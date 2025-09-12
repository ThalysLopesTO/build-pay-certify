-- Create phone_categories table
CREATE TABLE public.phone_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.phone_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for phone categories
CREATE POLICY "Company users can view phone categories for their company" 
ON public.phone_categories 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Company admins can create phone categories for their company" 
ON public.phone_categories 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() AND 
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management') 
    AND company_id = phone_categories.company_id
  )
);

CREATE POLICY "Company admins can update phone categories for their company" 
ON public.phone_categories 
FOR UPDATE 
USING (
  company_id = get_user_company_id() AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management') 
    AND company_id = phone_categories.company_id
  )
);

CREATE POLICY "Company admins can delete phone categories for their company" 
ON public.phone_categories 
FOR DELETE 
USING (
  company_id = get_user_company_id() AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management') 
    AND company_id = phone_categories.company_id
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phone_categories_updated_at
BEFORE UPDATE ON public.phone_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_company_phones_updated_at();

-- Seed default categories for existing companies
INSERT INTO public.phone_categories (company_id, name, description, created_by)
SELECT DISTINCT 
  c.id as company_id,
  category_name,
  category_description,
  (SELECT user_id FROM user_profiles WHERE company_id = c.id AND role IN ('admin', 'super_admin') LIMIT 1) as created_by
FROM companies c
CROSS JOIN (
  VALUES 
    ('Emergency', 'Emergency contact numbers'),
    ('Office', 'Main office and administrative contacts'),
    ('Management', 'Management and supervisor contacts'),
    ('Field', 'Field personnel and foremen contacts'),
    ('Supplier', 'Supplier and vendor contacts'),
    ('Client', 'Client and customer contacts'),
    ('Subcontractor', 'Subcontractor contacts'),
    ('Other', 'Other miscellaneous contacts')
) AS default_categories(category_name, category_description)
WHERE c.id IS NOT NULL;