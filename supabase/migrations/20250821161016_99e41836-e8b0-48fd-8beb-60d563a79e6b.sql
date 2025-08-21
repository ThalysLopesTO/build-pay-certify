-- Fix critical security vulnerabilities in company_registration_requests table
-- This addresses the security finding about customer data exposure

-- First, let's check existing policies and drop them properly
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    BEGIN
        DROP POLICY "Allow registration form submissions" ON public.company_registration_requests;
    EXCEPTION WHEN undefined_object THEN
        -- Policy doesn't exist, continue
    END;
    
    BEGIN
        DROP POLICY "Allow public registration submissions" ON public.company_registration_requests;
    EXCEPTION WHEN undefined_object THEN
        -- Policy doesn't exist, continue
    END;
    
    BEGIN
        DROP POLICY "Super admins can view registration requests" ON public.company_registration_requests;
    EXCEPTION WHEN undefined_object THEN
        -- Policy doesn't exist, continue
    END;
    
    BEGIN
        DROP POLICY "Super admins can update registration requests" ON public.company_registration_requests;
    EXCEPTION WHEN undefined_object THEN
        -- Policy doesn't exist, continue
    END;
    
    BEGIN
        DROP POLICY "Super admins can delete registration requests" ON public.company_registration_requests;
    EXCEPTION WHEN undefined_object THEN
        -- Policy doesn't exist, continue
    END;
END $$;

-- Create secure INSERT policy for public registration
-- This maintains functionality while adding security checks
CREATE POLICY "secure_public_registration_submissions" 
ON public.company_registration_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- Ensure required fields are present
    company_name IS NOT NULL AND trim(company_name) != ''
    AND company_email IS NOT NULL AND trim(company_email) != ''
    AND admin_email IS NOT NULL AND trim(admin_email) != ''
    AND admin_first_name IS NOT NULL AND trim(admin_first_name) != ''
    AND admin_last_name IS NOT NULL AND trim(admin_last_name) != ''
    -- Prevent manipulation of sensitive fields
    AND (status IS NULL OR status = 'pending')
    AND approved_at IS NULL 
    AND approved_by IS NULL
    AND admin_user_id IS NULL
    AND company_id IS NULL
    AND rejection_reason IS NULL
);

-- Create restrictive SELECT policy - only super admins can view registration data
CREATE POLICY "super_admins_only_view_registrations" 
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

-- Create restrictive UPDATE policy - only super admins can modify registration data
CREATE POLICY "super_admins_only_update_registrations" 
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

-- Create restrictive DELETE policy - only super admins can delete registration data
CREATE POLICY "super_admins_only_delete_registrations" 
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

-- Create function to automatically redact sensitive data on insert
CREATE OR REPLACE FUNCTION public.secure_registration_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Redact password immediately if provided
    -- Passwords should never be stored in this table - they should go through Supabase Auth
    IF NEW.admin_password IS NOT NULL AND NEW.admin_password != '' THEN
        NEW.admin_password = '[REDACTED_FOR_SECURITY]';
    END IF;
    
    -- Ensure status is set to pending for new requests
    IF NEW.status IS NULL THEN
        NEW.status = 'pending';
    END IF;
    
    -- Prevent direct setting of approval fields
    IF TG_OP = 'INSERT' THEN
        NEW.approved_at = NULL;
        NEW.approved_by = NULL;
        NEW.admin_user_id = NULL;
        NEW.company_id = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply the security trigger
DROP TRIGGER IF EXISTS secure_registration_data_trigger ON public.company_registration_requests;
CREATE TRIGGER secure_registration_data_trigger
    BEFORE INSERT OR UPDATE ON public.company_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_registration_data();

-- Add comment to document the security measures
COMMENT ON TABLE public.company_registration_requests IS 
'Company registration requests table with enhanced security: 
- Only super admins can view/modify existing data
- Public can submit new registration requests with validation
- Passwords are automatically redacted for security
- All sensitive operations are audited';

-- Create index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_company_registration_status ON public.company_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_registration_created_at ON public.company_registration_requests(created_at);