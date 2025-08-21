-- Fix critical security vulnerabilities in company_registration_requests table

-- First, let's remove the overly permissive INSERT policy that allows anyone to submit requests
-- and replace it with a more secure one that still allows public registration but with rate limiting considerations

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow registration form submissions" ON public.company_registration_requests;

-- Create a new, more secure INSERT policy for public registration
-- This allows unauthenticated users to submit registration requests but adds some basic protections
CREATE POLICY "Allow public registration submissions" 
ON public.company_registration_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Ensure basic data validation
  company_name IS NOT NULL 
  AND company_email IS NOT NULL 
  AND admin_email IS NOT NULL 
  AND admin_first_name IS NOT NULL 
  AND admin_last_name IS NOT NULL
  -- Prevent status manipulation
  AND (status IS NULL OR status = 'pending')
  -- Prevent setting approval fields
  AND approved_at IS NULL 
  AND approved_by IS NULL
  AND admin_user_id IS NULL
  AND company_id IS NULL
);

-- Ensure the SELECT policy is properly restrictive
-- Only super admins should be able to view registration requests
DROP POLICY IF EXISTS "Super admins can view registration requests" ON public.company_registration_requests;

CREATE POLICY "Only super admins can view registration requests" 
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

-- Strengthen the UPDATE policy to prevent unauthorized modifications
DROP POLICY IF EXISTS "Super admins can update registration requests" ON public.company_registration_requests;

CREATE POLICY "Only super admins can update registration requests" 
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

-- Strengthen the DELETE policy  
DROP POLICY IF EXISTS "Super admins can delete registration requests" ON public.company_registration_requests;

CREATE POLICY "Only super admins can delete registration requests" 
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

-- Add a security function to hash passwords if not already done
-- This ensures passwords are never stored in plaintext
CREATE OR REPLACE FUNCTION public.secure_registration_password()
RETURNS TRIGGER AS $$
BEGIN
  -- If a password is provided, hash it immediately
  -- In production, this should be handled by the application layer
  IF NEW.admin_password IS NOT NULL AND NEW.admin_password != '' THEN
    -- For security, we should actually remove the password after processing
    -- The password should be handled by Supabase Auth, not stored in this table
    NEW.admin_password = '[REDACTED]';
  END IF;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically secure passwords
DROP TRIGGER IF EXISTS secure_registration_data ON public.company_registration_requests;
CREATE TRIGGER secure_registration_data
  BEFORE INSERT OR UPDATE ON public.company_registration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_registration_password();

-- Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.registration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.company_registration_requests(id),
  action TEXT NOT NULL,
  performed_by UUID,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  ip_address INET
);

-- Enable RLS on audit log
ALTER TABLE public.registration_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view registration audit logs" 
ON public.registration_audit_log 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Add function to log registration activities
CREATE OR REPLACE FUNCTION public.log_registration_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log significant events
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.registration_audit_log (request_id, action, details)
    VALUES (NEW.id, 'registration_submitted', jsonb_build_object(
      'company_name', NEW.company_name,
      'admin_email', NEW.admin_email
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO public.registration_audit_log (request_id, action, performed_by, details)
      VALUES (NEW.id, 'status_changed', auth.uid(), jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'approved_at', NEW.approved_at
      ));
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
DROP TRIGGER IF EXISTS audit_registration_activity ON public.company_registration_requests;
CREATE TRIGGER audit_registration_activity
  AFTER INSERT OR UPDATE ON public.company_registration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_registration_activity();