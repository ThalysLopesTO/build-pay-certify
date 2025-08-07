-- Update RLS policies for material_requests to allow foremen to edit within 24 hours

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Foremen can update their own material requests within 24 hours" ON material_requests;

-- Create new policy for foremen to update their own requests within 24 hours
CREATE POLICY "Foremen can update their own material requests within 24 hours" 
ON material_requests 
FOR UPDATE 
USING (
  submitted_by = auth.uid() 
  AND created_at > NOW() - INTERVAL '24 hours'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'foreman'
    AND company_id = material_requests.company_id
  )
);