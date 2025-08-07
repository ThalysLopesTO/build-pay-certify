-- Create storage bucket for material request attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('material-request-attachments', 'material-request-attachments', true);

-- Create table for material request attachments
CREATE TABLE public.material_request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_request_id UUID NOT NULL REFERENCES public.material_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.material_request_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for material_request_attachments
CREATE POLICY "Users can view attachments for their company material requests" 
ON public.material_request_attachments 
FOR SELECT 
USING (
  material_request_id IN (
    SELECT id FROM public.material_requests 
    WHERE company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can insert attachments for their own material requests" 
ON public.material_request_attachments 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  material_request_id IN (
    SELECT id FROM public.material_requests 
    WHERE submitted_by = auth.uid() AND company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can delete attachments for their own material requests" 
ON public.material_request_attachments 
FOR DELETE 
USING (
  uploaded_by = auth.uid() AND
  material_request_id IN (
    SELECT id FROM public.material_requests 
    WHERE submitted_by = auth.uid() AND company_id = get_user_company_id()
  )
);

-- Create storage policies for material request attachments bucket
CREATE POLICY "Users can view material request attachments for their company" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'material-request-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload material request attachments for their company" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'material-request-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2] AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own material request attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'material-request-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_material_request_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_material_request_attachments_updated_at
  BEFORE UPDATE ON public.material_request_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_request_attachments_updated_at();