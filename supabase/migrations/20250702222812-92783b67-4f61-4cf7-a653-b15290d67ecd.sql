-- Add recurring bills functionality to bills_expenses table
ALTER TABLE public.bills_expenses 
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_frequency TEXT CHECK (recurrence_frequency IN ('weekly', 'bi-weekly', 'monthly', 'yearly')),
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN parent_recurring_bill_id UUID REFERENCES public.bills_expenses(id) ON DELETE CASCADE;

-- Create index for recurring bills queries
CREATE INDEX idx_bills_expenses_recurring ON public.bills_expenses(is_recurring, company_id);
CREATE INDEX idx_bills_expenses_parent ON public.bills_expenses(parent_recurring_bill_id);

-- Create function to generate recurring bills
CREATE OR REPLACE FUNCTION generate_recurring_bills()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  recurring_bill RECORD;
  next_date DATE;
  bill_exists BOOLEAN;
BEGIN
  -- Process all active recurring bills
  FOR recurring_bill IN 
    SELECT * FROM public.bills_expenses 
    WHERE is_recurring = TRUE 
    AND parent_recurring_bill_id IS NULL 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    -- Calculate next occurrence based on frequency
    CASE recurring_bill.recurrence_frequency
      WHEN 'weekly' THEN
        next_date := recurring_bill.start_date + (FLOOR(EXTRACT(EPOCH FROM (CURRENT_DATE - recurring_bill.start_date)) / (7 * 24 * 3600)) + 1) * INTERVAL '7 days';
      WHEN 'bi-weekly' THEN
        next_date := recurring_bill.start_date + (FLOOR(EXTRACT(EPOCH FROM (CURRENT_DATE - recurring_bill.start_date)) / (14 * 24 * 3600)) + 1) * INTERVAL '14 days';
      WHEN 'monthly' THEN
        next_date := recurring_bill.start_date + (EXTRACT(YEAR FROM age(CURRENT_DATE, recurring_bill.start_date)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, recurring_bill.start_date)) + 1) * INTERVAL '1 month';
      WHEN 'yearly' THEN
        next_date := recurring_bill.start_date + (EXTRACT(YEAR FROM age(CURRENT_DATE, recurring_bill.start_date)) + 1) * INTERVAL '1 year';
    END CASE;
    
    -- Only create if within valid range and doesn't already exist
    IF (recurring_bill.end_date IS NULL OR next_date <= recurring_bill.end_date) 
       AND next_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      
      -- Check if bill already exists for this period
      SELECT EXISTS(
        SELECT 1 FROM public.bills_expenses 
        WHERE parent_recurring_bill_id = recurring_bill.id 
        AND expense_date = next_date
      ) INTO bill_exists;
      
      IF NOT bill_exists THEN
        -- Create the recurring bill instance
        INSERT INTO public.bills_expenses (
          company_id,
          expense_title,
          category_id,
          vendor_payee,
          expense_date,
          amount,
          payment_status,
          payment_method,
          notes,
          created_by,
          parent_recurring_bill_id,
          is_recurring
        ) VALUES (
          recurring_bill.company_id,
          recurring_bill.expense_title,
          recurring_bill.category_id,
          recurring_bill.vendor_payee,
          next_date,
          recurring_bill.amount,
          'unpaid',
          recurring_bill.payment_method,
          recurring_bill.notes,
          recurring_bill.created_by,
          recurring_bill.id,
          FALSE
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;