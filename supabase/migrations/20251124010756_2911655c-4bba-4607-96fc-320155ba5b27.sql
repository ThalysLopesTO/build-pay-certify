-- Create company_time_rules table
CREATE TABLE public.company_time_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week SMALLINT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  work_start_time TIME NOT NULL,
  work_end_time TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  break_is_paid BOOLEAN NOT NULL DEFAULT false,
  early_grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK (early_grace_minutes >= 0),
  late_grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK (late_grace_minutes >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on company_time_rules
ALTER TABLE public.company_time_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_time_rules (following company_settings pattern)
CREATE POLICY "Company admins can manage their company time rules"
ON public.company_time_rules
FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND user_profiles.company_id = company_time_rules.company_id
    AND role IN ('admin', 'super_admin', 'management')
  )
)
WITH CHECK (
  company_id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND user_profiles.company_id = company_time_rules.company_id
    AND role IN ('admin', 'super_admin', 'management')
  )
);

-- Users can view time rules for their company
CREATE POLICY "Users can view their company time rules"
ON public.company_time_rules
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

-- Super admins can view all time rules
CREATE POLICY "Super admins can view all company time rules"
ON public.company_time_rules
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Create trigger function for company_time_rules updated_at
CREATE OR REPLACE FUNCTION public.update_company_time_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_time_rules_updated_at
BEFORE UPDATE ON public.company_time_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_company_time_rules_updated_at();

-- Create jobsite_time_rules table
CREATE TABLE public.jobsite_time_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  inherits_company_rule BOOLEAN NOT NULL DEFAULT true,
  work_start_time TIME NULL,
  work_end_time TIME NULL,
  break_minutes INTEGER DEFAULT 0 CHECK (break_minutes >= 0),
  break_is_paid BOOLEAN DEFAULT false,
  early_grace_minutes INTEGER DEFAULT 0 CHECK (early_grace_minutes >= 0),
  late_grace_minutes INTEGER DEFAULT 0 CHECK (late_grace_minutes >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_rule_when_not_inheriting CHECK (
    inherits_company_rule = true OR (
      work_start_time IS NOT NULL AND work_end_time IS NOT NULL
    )
  )
);

-- Create index on jobsite_id for performance
CREATE INDEX idx_jobsite_time_rules_jobsite_id ON public.jobsite_time_rules(jobsite_id);

-- Ensure only one rule per jobsite
CREATE UNIQUE INDEX idx_jobsite_time_rules_unique_jobsite ON public.jobsite_time_rules(jobsite_id);

-- Enable RLS on jobsite_time_rules
ALTER TABLE public.jobsite_time_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for jobsite_time_rules (following jobsite pattern)
CREATE POLICY "Admins and foremen can manage jobsite time rules"
ON public.jobsite_time_rules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobsites j
    INNER JOIN public.user_profiles up ON up.company_id = j.company_id
    WHERE j.id = jobsite_time_rules.jobsite_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobsites j
    INNER JOIN public.user_profiles up ON up.company_id = j.company_id
    WHERE j.id = jobsite_time_rules.jobsite_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- Users can view jobsite time rules for jobsites in their company
CREATE POLICY "Users can view jobsite time rules for their company"
ON public.jobsite_time_rules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobsites j
    INNER JOIN public.user_profiles up ON up.company_id = j.company_id
    WHERE j.id = jobsite_time_rules.jobsite_id
    AND up.user_id = auth.uid()
  )
);

-- Create trigger function for jobsite_time_rules updated_at
CREATE OR REPLACE FUNCTION public.update_jobsite_time_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobsite_time_rules_updated_at
BEFORE UPDATE ON public.jobsite_time_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_jobsite_time_rules_updated_at();