-- Create company_phones table for managing company phone directory
CREATE TABLE public.company_phones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  extension TEXT,
  notes TEXT,
  company_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.company_phones ENABLE ROW LEVEL SECURITY;

-- Create policies for company phone management
CREATE POLICY "Company users can view phones for their company" 
ON public.company_phones 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Company admins can create phones for their company" 
ON public.company_phones 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() 
  AND created_by = auth.uid()
  AND (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = company_phones.company_id
  ))
);

CREATE POLICY "Company admins can update phones for their company" 
ON public.company_phones 
FOR UPDATE 
USING (
  company_id = get_user_company_id()
  AND (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = company_phones.company_id
  ))
);

CREATE POLICY "Company admins can delete phones for their company" 
ON public.company_phones 
FOR DELETE 
USING (
  company_id = get_user_company_id()
  AND (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
    AND company_id = company_phones.company_id
  ))
);

-- Create function to update timestamps
CREATE TRIGGER update_company_phones_updated_at
BEFORE UPDATE ON public.company_phones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();