-- Phase 1: Extend bills_expenses table to support both income and expenses
ALTER TABLE public.bills_expenses 
ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense'));

-- Add index for better performance on filtered queries
CREATE INDEX idx_bills_expenses_company_type_date ON public.bills_expenses (company_id, transaction_type, expense_date);

-- Phase 2: Extend expense_categories to support income categories
ALTER TABLE public.expense_categories 
ADD COLUMN category_type TEXT NOT NULL DEFAULT 'expense' CHECK (category_type IN ('income', 'expense', 'both'));

-- Create default income categories for existing companies
INSERT INTO public.expense_categories (company_id, name, category_level, category_type, sort_order)
SELECT DISTINCT 
  company_id,
  'Sales Revenue' as name,
  'parent' as category_level,
  'income' as category_type,
  1 as sort_order
FROM public.bills_expenses
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories 
  WHERE expense_categories.company_id = bills_expenses.company_id 
  AND expense_categories.name = 'Sales Revenue' 
  AND expense_categories.category_type = 'income'
);

INSERT INTO public.expense_categories (company_id, name, category_level, category_type, sort_order)
SELECT DISTINCT 
  company_id,
  'Service Income' as name,
  'parent' as category_level,
  'income' as category_type,
  2 as sort_order
FROM public.bills_expenses
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories 
  WHERE expense_categories.company_id = bills_expenses.company_id 
  AND expense_categories.name = 'Service Income' 
  AND expense_categories.category_type = 'income'
);

INSERT INTO public.expense_categories (company_id, name, category_level, category_type, sort_order)
SELECT DISTINCT 
  company_id,
  'Interest & Investments' as name,
  'parent' as category_level,
  'income' as category_type,
  3 as sort_order
FROM public.bills_expenses
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories 
  WHERE expense_categories.company_id = bills_expenses.company_id 
  AND expense_categories.name = 'Interest & Investments' 
  AND expense_categories.category_type = 'income'
);

INSERT INTO public.expense_categories (company_id, name, category_level, category_type, sort_order)
SELECT DISTINCT 
  company_id,
  'Other Income' as name,
  'parent' as category_level,
  'income' as category_type,
  4 as sort_order
FROM public.bills_expenses
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories 
  WHERE expense_categories.company_id = bills_expenses.company_id 
  AND expense_categories.name = 'Other Income' 
  AND expense_categories.category_type = 'income'
);