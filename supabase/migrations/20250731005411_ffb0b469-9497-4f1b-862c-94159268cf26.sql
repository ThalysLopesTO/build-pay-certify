-- Add missing fields for edit/delete functionality to missed_punch_requests table
ALTER TABLE public.missed_punch_requests 
ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_missed_punch_requests_deleted ON public.missed_punch_requests(deleted);
CREATE INDEX IF NOT EXISTS idx_missed_punch_requests_edited_by ON public.missed_punch_requests(edited_by);

-- Update RLS policies to handle edit/delete permissions
CREATE POLICY "Admins can edit and delete company requests" ON public.missed_punch_requests
FOR UPDATE USING (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management') 
    AND company_id = missed_punch_requests.company_id
  ))
);

-- Allow soft delete by updating the deleted field
CREATE POLICY "Admins can soft delete company requests" ON public.missed_punch_requests
FOR UPDATE USING (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management') 
    AND company_id = missed_punch_requests.company_id
  ))
);

-- Update existing policies to exclude deleted records
DROP POLICY IF EXISTS "Employees can view their own requests" ON public.missed_punch_requests;
CREATE POLICY "Employees can view their own requests" ON public.missed_punch_requests
FOR SELECT USING (requested_by = auth.uid() AND deleted = false);

DROP POLICY IF EXISTS "Managers and admins can view company requests" ON public.missed_punch_requests;
CREATE POLICY "Managers and admins can view company requests" ON public.missed_punch_requests
FOR SELECT USING (
  (company_id = get_user_company_id()) AND 
  (deleted = false) AND
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management', 'foreman') 
    AND company_id = missed_punch_requests.company_id
  ))
);