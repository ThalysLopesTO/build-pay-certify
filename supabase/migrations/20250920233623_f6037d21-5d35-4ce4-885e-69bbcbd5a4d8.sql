-- Create change_orders table
CREATE TABLE public.change_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  project_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin', 'foreman_request')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'completed')),
  cost NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  attachments TEXT[] DEFAULT '{}',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company users can view their change orders"
ON public.change_orders
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Admins and foremen can create change orders"
ON public.change_orders
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() 
  AND created_by = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  )
);

CREATE POLICY "Admins can update all change orders"
ON public.change_orders
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  )
);

CREATE POLICY "Foremen can update their own requests"
ON public.change_orders
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND created_by = auth.uid()
  AND type = 'foreman_request'
  AND status IN ('draft', 'submitted')
);

CREATE POLICY "Admins can delete change orders"
ON public.change_orders
FOR DELETE
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  )
);

-- Create storage bucket for change order files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('change-orders', 'change-orders', false);

-- Create storage policies
CREATE POLICY "Company users can view their change order files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'change-orders' 
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can upload change order files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'change-orders'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own change order files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'change-orders'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own change order files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'change-orders'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_change_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_change_orders_updated_at
BEFORE UPDATE ON public.change_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_change_orders_updated_at();