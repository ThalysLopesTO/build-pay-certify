-- Create equipment_usage_log table for tracking daily equipment assignments
CREATE TABLE public.equipment_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  return_time TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use', 'returned', 'damaged', 'lost')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_equipment_usage_company ON equipment_usage_log(company_id);
CREATE INDEX idx_equipment_usage_equipment ON equipment_usage_log(equipment_id);
CREATE INDEX idx_equipment_usage_employee ON equipment_usage_log(employee_id);
CREATE INDEX idx_equipment_usage_status ON equipment_usage_log(status);
CREATE INDEX idx_equipment_usage_start_time ON equipment_usage_log(start_time);

-- Unique constraint: Only ONE active 'in_use' record per equipment (prevents double checkout)
CREATE UNIQUE INDEX idx_equipment_active_usage 
ON equipment_usage_log(equipment_id) 
WHERE status = 'in_use';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_equipment_usage_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_usage_log_updated_at
BEFORE UPDATE ON equipment_usage_log
FOR EACH ROW
EXECUTE FUNCTION update_equipment_usage_log_updated_at();

-- Enable RLS
ALTER TABLE equipment_usage_log ENABLE ROW LEVEL SECURITY;

-- Admin/Manager/Foreman: Full access within company
CREATE POLICY "Admins and foremen can manage usage logs"
ON equipment_usage_log
FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = equipment_usage_log.company_id
  )
)
WITH CHECK (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = equipment_usage_log.company_id
  )
);

-- Employees: Read-only for their own records
CREATE POLICY "Employees can view their own usage logs"
ON equipment_usage_log
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid()
  AND company_id = get_user_company_id()
);