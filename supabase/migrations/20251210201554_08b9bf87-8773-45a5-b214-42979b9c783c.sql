-- Create inventory_photos table
CREATE TABLE public.inventory_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view photos for their company inventory"
ON public.inventory_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inventory i
    JOIN public.user_profiles up ON up.company_id = i.company_id
    WHERE i.id = inventory_photos.inventory_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert photos"
ON public.inventory_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

CREATE POLICY "Admins can delete photos"
ON public.inventory_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_inventory_photos_inventory_id ON public.inventory_photos(inventory_id);

-- Create storage bucket for equipment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-photos', 'equipment-photos', true);

-- Storage policies for equipment-photos bucket
CREATE POLICY "Anyone can view equipment photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated users can upload equipment photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their uploaded equipment photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);