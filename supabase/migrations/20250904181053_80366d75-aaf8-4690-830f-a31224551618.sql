-- Add hierarchical support to expense_categories table
ALTER TABLE public.expense_categories 
ADD COLUMN parent_category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
ADD COLUMN category_level TEXT NOT NULL DEFAULT 'parent' CHECK (category_level IN ('parent', 'subcategory')),
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_expense_categories_parent_id ON public.expense_categories(parent_category_id);
CREATE INDEX idx_expense_categories_level ON public.expense_categories(category_level);
CREATE INDEX idx_expense_categories_sort ON public.expense_categories(sort_order);

-- Migrate existing categories to parent level
UPDATE public.expense_categories 
SET category_level = 'parent', sort_order = 0
WHERE category_level IS NULL OR category_level = 'parent';

-- Create view for hierarchical category display
CREATE OR REPLACE VIEW public.expense_categories_hierarchy AS
SELECT 
  e.id as expense_id,
  e.company_id,
  e.expense_date,
  e.amount,
  e.expense_title,
  e.vendor_payee,
  e.payment_status,
  e.payment_method,
  e.notes,
  e.created_at,
  e.updated_at,
  COALESCE(parent_cat.name, cat.name) as parent_category_name,
  CASE 
    WHEN cat.category_level = 'subcategory' THEN cat.name
    ELSE NULL 
  END as subcategory_name,
  COALESCE(parent_cat.id, cat.id) as parent_category_id,
  cat.id as category_id,
  cat.category_level
FROM public.bills_expenses e
LEFT JOIN public.expense_categories cat ON e.category_id = cat.id
LEFT JOIN public.expense_categories parent_cat ON cat.parent_category_id = parent_cat.id;