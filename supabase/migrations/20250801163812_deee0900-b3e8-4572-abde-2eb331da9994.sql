-- Create daily_reports table
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL,
  submitted_by UUID NOT NULL,
  company_id UUID NOT NULL,
  summary TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for daily reports
CREATE POLICY "Foremen can create daily reports for their company" 
ON public.daily_reports 
FOR INSERT 
WITH CHECK (
  submitted_by = auth.uid() 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('foreman', 'admin', 'super_admin')
  )
);

CREATE POLICY "Users can view daily reports for their company" 
ON public.daily_reports 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Admins can update daily reports for their company" 
ON public.daily_reports 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete daily reports for their company" 
ON public.daily_reports 
FOR DELETE 
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create storage bucket for daily report photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-report-photos', 'daily-report-photos', true);

-- Create storage policies for daily report photos
CREATE POLICY "Users can view daily report photos for their company" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'daily-report-photos');

CREATE POLICY "Foremen can upload daily report photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'daily-report-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their daily report photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'daily-report-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their daily report photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'daily-report-photos' 
  AND auth.uid() IS NOT NULL
);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_daily_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_reports_updated_at();