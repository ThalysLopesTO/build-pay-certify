-- Create enum for punch types (check if exists first)
DO $$ BEGIN
    CREATE TYPE public.punch_type AS ENUM ('in', 'out', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create missed_punch_requests table
CREATE TABLE public.missed_punch_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  request_date DATE NOT NULL,
  punch_type punch_type NOT NULL,
  corrected_time_in TIMESTAMP WITH TIME ZONE,
  corrected_time_out TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  supervisor_on_site TEXT NOT NULL,
  jobsite_id UUID NOT NULL,
  attachment_url TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.missed_punch_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Employees can view their own requests
CREATE POLICY "Employees can view their own requests"
ON public.missed_punch_requests
FOR SELECT
USING (requested_by = auth.uid());

-- Employees can create their own requests
CREATE POLICY "Employees can create their own requests"
ON public.missed_punch_requests
FOR INSERT
WITH CHECK (
  requested_by = auth.uid() 
  AND employee_id = auth.uid()
  AND company_id = get_user_company_id()
);

-- Managers and admins can view requests for their company
CREATE POLICY "Managers and admins can view company requests"
ON public.missed_punch_requests
FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- Managers and admins can update requests (approve/decline)
CREATE POLICY "Managers and admins can update requests"
ON public.missed_punch_requests
FOR UPDATE
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- License check policies
CREATE POLICY "Allow access only if company license is active - SELECT"
ON public.missed_punch_requests
FOR SELECT
USING (is_company_license_active());

CREATE POLICY "Allow access only if company license is active - INSERT"
ON public.missed_punch_requests
FOR INSERT
WITH CHECK (is_company_license_active());

CREATE POLICY "Allow access only if company license is active - UPDATE"
ON public.missed_punch_requests
FOR UPDATE
USING (is_company_license_active());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_missed_punch_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_missed_punch_requests_updated_at
  BEFORE UPDATE ON public.missed_punch_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_missed_punch_requests_updated_at();

-- Create function to handle request approval (automatically create timesheet entry)
CREATE OR REPLACE FUNCTION public.approve_missed_punch_request(request_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result json;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM public.missed_punch_requests
  WHERE id = request_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Verify user has permission to approve
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND company_id = request_record.company_id
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Create or update timesheet entry based on punch type
  IF request_record.punch_type = 'in' THEN
    -- Insert new timesheet with punch in
    INSERT INTO public.timesheets (
      user_id,
      company_id,
      jobsite_id,
      check_in_time,
      notes
    ) VALUES (
      request_record.employee_id,
      request_record.company_id,
      request_record.jobsite_id,
      request_record.corrected_time_in,
      'Corrected punch-in via missed punch request'
    );
  ELSIF request_record.punch_type = 'out' THEN
    -- Update existing open timesheet with punch out
    UPDATE public.timesheets 
    SET 
      check_out_time = request_record.corrected_time_out,
      notes = COALESCE(notes || ' | ', '') || 'Corrected punch-out via missed punch request'
    WHERE user_id = request_record.employee_id
    AND DATE(check_in_time) = request_record.request_date
    AND check_out_time IS NULL
    AND company_id = request_record.company_id;
  ELSIF request_record.punch_type = 'both' THEN
    -- Insert complete timesheet entry
    INSERT INTO public.timesheets (
      user_id,
      company_id,
      jobsite_id,
      check_in_time,
      check_out_time,
      notes
    ) VALUES (
      request_record.employee_id,
      request_record.company_id,
      request_record.jobsite_id,
      request_record.corrected_time_in,
      request_record.corrected_time_out,
      'Complete timesheet via missed punch request'
    );
  END IF;
  
  -- Update request status
  UPDATE public.missed_punch_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = request_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Request approved and timesheet updated'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;