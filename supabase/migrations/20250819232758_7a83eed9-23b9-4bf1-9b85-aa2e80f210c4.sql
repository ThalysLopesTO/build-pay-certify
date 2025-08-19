-- Fix security vulnerability in company_registration_requests table
-- Remove overly permissive policies and restrict access to super admins only

-- Drop all existing policies on company_registration_requests
DROP POLICY IF EXISTS "Authenticated users can submit registration requests" ON public.company_registration_requests;
DROP POLICY IF EXISTS "Public can submit registration requests" ON public.company_registration_requests;
DROP POLICY IF EXISTS "Super admins can view all registration requests" ON public.company_registration_requests;

-- Create secure policies

-- Allow unauthenticated users to submit registration requests (for initial company signup)
CREATE POLICY "Allow registration form submissions" 
ON public.company_registration_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Restrict SELECT access to super admins only
CREATE POLICY "Super admins can view registration requests" 
ON public.company_registration_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super admins to update registration requests (for approval/rejection)
CREATE POLICY "Super admins can update registration requests" 
ON public.company_registration_requests 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super admins to delete registration requests if needed
CREATE POLICY "Super admins can delete registration requests" 
ON public.company_registration_requests 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Add a comment to document the security fix
COMMENT ON TABLE public.company_registration_requests IS 'Company registration requests table. Contains sensitive data - access restricted to super admins only for SELECT/UPDATE/DELETE operations. INSERT allowed for registration forms.';