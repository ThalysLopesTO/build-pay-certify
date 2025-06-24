
-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  project_name TEXT NOT NULL,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(5,2) DEFAULT 0,
  discount DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sent_date TIMESTAMP WITH TIME ZONE,
  accepted_date TIMESTAMP WITH TIME ZONE,
  declined_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_line_items table
CREATE TABLE public.quote_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  vendor TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for quotes
CREATE POLICY "Users can view quotes from their company" 
  ON public.quotes 
  FOR SELECT 
  USING (company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create quotes" 
  ON public.quotes 
  FOR INSERT 
  WITH CHECK (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update quotes from their company" 
  ON public.quotes 
  FOR UPDATE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete quotes from their company" 
  ON public.quotes 
  FOR DELETE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create policies for quote_line_items
CREATE POLICY "Users can view line items for quotes from their company" 
  ON public.quote_line_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage line items for quotes from their company" 
  ON public.quote_line_items 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  quote_num TEXT;
BEGIN
  -- Get the next number by counting existing quotes + 1
  SELECT COUNT(*) + 1 INTO next_num FROM public.quotes;
  
  -- Format as QUO-0001, QUO-0002, etc.
  quote_num := 'QUO-' || LPAD(next_num::TEXT, 4, '0');
  
  -- Check if this number already exists (in case of concurrent inserts)
  WHILE EXISTS (SELECT 1 FROM public.quotes WHERE quote_number = quote_num) LOOP
    next_num := next_num + 1;
    quote_num := 'QUO-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;
  
  RETURN quote_num;
END;
$$;

-- Trigger to set quote number
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := public.generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_number();

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION public.calculate_quote_totals(quote_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  line_items_total DECIMAL(10,2);
  discount_amount DECIMAL(10,2);
  tax_amount DECIMAL(10,2);
  final_total DECIMAL(10,2);
  quote_discount DECIMAL(5,2);
  quote_tax DECIMAL(5,2);
BEGIN
  -- Get quote discount and tax rates
  SELECT discount, tax INTO quote_discount, quote_tax 
  FROM public.quotes 
  WHERE id = quote_id_param;
  
  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(amount), 0) INTO line_items_total
  FROM public.quote_line_items
  WHERE quote_id = quote_id_param;
  
  -- Calculate discount amount
  discount_amount := line_items_total * (quote_discount / 100);
  
  -- Calculate tax amount (after discount)
  tax_amount := (line_items_total - discount_amount) * (quote_tax / 100);
  
  -- Calculate final total
  final_total := line_items_total - discount_amount + tax_amount;
  
  -- Update quote with calculated totals
  UPDATE public.quotes 
  SET 
    subtotal = line_items_total,
    total_amount = final_total,
    updated_at = now()
  WHERE id = quote_id_param;
END;
$$;

-- Trigger to recalculate quote totals when line items change
CREATE OR REPLACE FUNCTION public.recalculate_quote_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_quote_totals(NEW.quote_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_quote_totals(OLD.quote_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER recalculate_quote_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_quote_totals();

-- Trigger to calculate line item amounts
CREATE OR REPLACE FUNCTION public.calculate_quote_line_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.amount := NEW.quantity * NEW.unit_price;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_quote_line_amount_trigger
  BEFORE INSERT OR UPDATE ON public.quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_quote_line_amount();
