-- Create expense-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-attachments', 'expense-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for expense-attachments bucket
CREATE POLICY "Users can upload expense attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-attachments');

CREATE POLICY "Users can view expense attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-attachments');

CREATE POLICY "Users can delete own expense attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-attachments');