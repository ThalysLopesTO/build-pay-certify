-- Add photo_url field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN photo_url TEXT;

-- Create storage bucket for employee photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-photos', 'employee-photos', true);

-- Create storage policies for employee photos
CREATE POLICY "Company users can view employee photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-photos' AND 
       EXISTS (
         SELECT 1 FROM public.user_profiles up1, public.user_profiles up2
         WHERE up1.user_id = auth.uid() 
         AND up2.user_id::text = (storage.foldername(name))[1]
         AND up1.company_id = up2.company_id
       ));

CREATE POLICY "Company admins can upload employee photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-photos' AND 
            EXISTS (
              SELECT 1 FROM public.user_profiles
              WHERE user_id = auth.uid() 
              AND role IN ('admin', 'super_admin')
            ));

CREATE POLICY "Company admins can update employee photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'employee-photos' AND 
       EXISTS (
         SELECT 1 FROM public.user_profiles
         WHERE user_id = auth.uid() 
         AND role IN ('admin', 'super_admin')
       ));

CREATE POLICY "Company admins can delete employee photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee-photos' AND 
       EXISTS (
         SELECT 1 FROM public.user_profiles
         WHERE user_id = auth.uid() 
         AND role IN ('admin', 'super_admin')
       ));