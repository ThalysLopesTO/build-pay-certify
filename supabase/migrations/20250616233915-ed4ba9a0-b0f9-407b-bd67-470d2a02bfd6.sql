
-- Create safety_templates table
CREATE TABLE public.safety_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.safety_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for safety templates
-- Allow users to view templates from their company
CREATE POLICY "Users can view company safety templates" 
  ON public.safety_templates 
  FOR SELECT 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'foreman', 'super_admin')
  );

-- Allow admins to insert templates
CREATE POLICY "Admins can create safety templates" 
  ON public.safety_templates 
  FOR INSERT 
  WITH CHECK (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Allow admins to delete templates
CREATE POLICY "Admins can delete safety templates" 
  ON public.safety_templates 
  FOR DELETE 
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Create storage bucket for safety templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('safety-templates', 'safety-templates', false);

-- Create storage policies
CREATE POLICY "Company members can view safety templates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'safety-templates' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload safety templates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'safety-templates' 
    AND auth.role() = 'authenticated'
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can delete safety templates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'safety-templates' 
    AND auth.role() = 'authenticated'
    AND (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );
