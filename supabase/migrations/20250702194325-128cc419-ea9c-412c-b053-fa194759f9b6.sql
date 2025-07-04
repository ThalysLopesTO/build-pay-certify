-- Create expense_categories table for managing expense categories
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bills_expenses table for tracking company expenses
CREATE TABLE public.bills_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  expense_title TEXT NOT NULL,
  category_id UUID,
  vendor_payee TEXT NOT NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'scheduled')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash', 'cheque', 'other')),
  notes TEXT,
  attachment_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Company admins can manage expense categories"
ON public.expense_categories
FOR ALL
USING (
  company_id = get_user_company_id() AND 
  is_company_admin()
);

CREATE POLICY "Users can view expense categories for their company"
ON public.expense_categories
FOR SELECT
USING (company_id = get_user_company_id());

-- RLS Policies for bills_expenses
CREATE POLICY "Company users can view bills/expenses for their company"
ON public.bills_expenses
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Authorized users can create bills/expenses"
ON public.bills_expenses
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  created_by = auth.uid()
);

CREATE POLICY "Authorized users can update bills/expenses"
ON public.bills_expenses
FOR UPDATE
USING (company_id = get_user_company_id());

CREATE POLICY "Authorized users can delete bills/expenses"
ON public.bills_expenses
FOR DELETE
USING (company_id = get_user_company_id());

-- Add foreign key relationships
ALTER TABLE public.expense_categories
ADD CONSTRAINT expense_categories_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE public.bills_expenses
ADD CONSTRAINT bills_expenses_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE public.bills_expenses
ADD CONSTRAINT bills_expenses_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);

-- Create default expense categories for each company
INSERT INTO public.expense_categories (company_id, name)
SELECT 
  c.id,
  category_name
FROM public.companies c
CROSS JOIN (
  VALUES 
    ('Utilities'),
    ('Rent'),
    ('Office Supplies'),
    ('Travel'),
    ('Marketing'),
    ('Subcontractor'),
    ('Legal'),
    ('Software'),
    ('Other')
) AS categories(category_name)
WHERE c.id IS NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bills_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bills_expenses_updated_at
BEFORE UPDATE ON public.bills_expenses
FOR EACH ROW
EXECUTE FUNCTION update_bills_expenses_updated_at();

CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION update_bills_expenses_updated_at();