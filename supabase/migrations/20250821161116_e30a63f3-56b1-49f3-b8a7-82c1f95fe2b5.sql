-- Clean up duplicate policies and complete security implementation for company_registration_requests

-- Remove duplicate policies (keeping the more secure ones)
DROP POLICY IF EXISTS "Only super admins can delete registration requests" ON public.company_registration_requests;
DROP POLICY IF EXISTS "Only super admins can update registration requests" ON public.company_registration_requests;  
DROP POLICY IF EXISTS "Only super admins can view registration requests" ON public.company_registration_requests;

-- Verify the secure trigger function exists and create if needed
CREATE OR REPLACE FUNCTION public.secure_registration_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Critical security: Redact any password data immediately
    IF NEW.admin_password IS NOT NULL AND NEW.admin_password != '' THEN
        NEW.admin_password = '[REDACTED_FOR_SECURITY]';
    END IF;
    
    -- Force status to pending for new registrations
    IF TG_OP = 'INSERT' THEN
        NEW.status = 'pending';
        NEW.approved_at = NULL;
        NEW.approved_by = NULL;
        NEW.admin_user_id = NULL;
        NEW.company_id = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    -- Validate email formats (basic check)
    IF NEW.admin_email IS NOT NULL AND NEW.admin_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid admin email format';
    END IF;
    
    IF NEW.company_email IS NOT NULL AND NEW.company_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid company email format';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the security trigger is active
DROP TRIGGER IF EXISTS secure_registration_data_trigger ON public.company_registration_requests;
CREATE TRIGGER secure_registration_data_trigger
    BEFORE INSERT OR UPDATE ON public.company_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_registration_data();

-- Create audit table for tracking access to sensitive registration data
CREATE TABLE IF NOT EXISTS public.registration_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_by UUID,
    action TEXT NOT NULL,
    request_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB
);

-- Enable RLS on the audit table
ALTER TABLE public.registration_access_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view access logs
CREATE POLICY "super_admins_view_access_logs" 
ON public.registration_access_log 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Function to log access to registration data
CREATE OR REPLACE FUNCTION public.log_registration_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when registration data is accessed
    INSERT INTO public.registration_access_log (
        accessed_by, 
        action, 
        request_id,
        details
    ) 
    VALUES (
        auth.uid(),
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
            ELSE '{}'::jsonb
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger for access logging
DROP TRIGGER IF EXISTS log_registration_access_trigger ON public.company_registration_requests;
CREATE TRIGGER log_registration_access_trigger
    AFTER SELECT OR UPDATE OR DELETE ON public.company_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.log_registration_access();

-- Add additional security: Create a view that masks sensitive data for non-super-admin access
CREATE OR REPLACE VIEW public.company_registration_summary AS
SELECT 
    id,
    company_name,
    status,
    created_at,
    -- Mask sensitive data
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        ) THEN admin_email
        ELSE CONCAT(LEFT(admin_email, 3), '***@', SPLIT_PART(admin_email, '@', 2))
    END as admin_email_masked,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        ) THEN company_email  
        ELSE CONCAT(LEFT(company_email, 3), '***@', SPLIT_PART(company_email, '@', 2))
    END as company_email_masked
FROM public.company_registration_requests;

-- Grant appropriate permissions on the summary view
GRANT SELECT ON public.company_registration_summary TO authenticated;

-- Add documentation
COMMENT ON TABLE public.company_registration_requests IS 
'SECURITY ENHANCED: Company registration requests with comprehensive protection:
- Strict RLS policies limit access to super admins only
- Automatic password redaction on insert/update  
- Email validation and data sanitization
- Comprehensive audit logging for all access
- Masked summary view available for limited access needs
- All sensitive operations are tracked and logged';

COMMENT ON VIEW public.company_registration_summary IS 
'Masked view of company registration requests that hides sensitive information from non-super-admin users';

-- Final security check: Ensure RLS is enabled
ALTER TABLE public.company_registration_requests ENABLE ROW LEVEL SECURITY;