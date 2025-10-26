-- Create role_permissions table to store menu visibility permissions
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'foreman', 'management', 'account', 'employee')),
  menu_item_id TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, role, menu_item_id)
);

-- Add index for faster lookups
CREATE INDEX idx_role_permissions_company_role ON public.role_permissions(company_id, role);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can manage their role permissions
CREATE POLICY "Company admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (
  company_id = get_user_company_id() 
  AND is_company_admin()
)
WITH CHECK (
  company_id = get_user_company_id() 
  AND is_company_admin()
);

-- Policy: Users can view their company's role permissions
CREATE POLICY "Users can view company role permissions"
ON public.role_permissions
FOR SELECT
USING (company_id = get_user_company_id());

-- Function to seed default role permissions for a new company
CREATE OR REPLACE FUNCTION public.seed_default_role_permissions(company_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin: All menu items visible
  INSERT INTO public.role_permissions (company_id, role, menu_item_id, is_visible)
  VALUES
    -- Admin - Full Access
    (company_uuid, 'admin', 'dashboard', true),
    (company_uuid, 'admin', 'timesheets', true),
    (company_uuid, 'admin', 'employees', true),
    (company_uuid, 'admin', 'jobsite-management', true),
    (company_uuid, 'admin', 'invoice-management', true),
    (company_uuid, 'admin', 'quotes', true),
    (company_uuid, 'admin', 'bills-expenses', true),
    (company_uuid, 'admin', 'material-requests', true),
    (company_uuid, 'admin', 'inventory', true),
    (company_uuid, 'admin', 'attention-reports', true),
    (company_uuid, 'admin', 'daily-reports', true),
    (company_uuid, 'admin', 'system-settings', true),
    
    -- Management - Most access
    (company_uuid, 'management', 'dashboard', true),
    (company_uuid, 'management', 'timesheets', true),
    (company_uuid, 'management', 'employees', true),
    (company_uuid, 'management', 'jobsite-management', true),
    (company_uuid, 'management', 'invoice-management', true),
    (company_uuid, 'management', 'quotes', true),
    (company_uuid, 'management', 'bills-expenses', true),
    (company_uuid, 'management', 'material-requests', true),
    (company_uuid, 'management', 'inventory', true),
    (company_uuid, 'management', 'attention-reports', true),
    (company_uuid, 'management', 'daily-reports', true),
    (company_uuid, 'management', 'system-settings', false),
    
    -- Foreman - Field operations
    (company_uuid, 'foreman', 'dashboard', true),
    (company_uuid, 'foreman', 'timesheets', true),
    (company_uuid, 'foreman', 'employees', true),
    (company_uuid, 'foreman', 'jobsite-management', true),
    (company_uuid, 'foreman', 'invoice-management', false),
    (company_uuid, 'foreman', 'quotes', false),
    (company_uuid, 'foreman', 'bills-expenses', false),
    (company_uuid, 'foreman', 'material-requests', true),
    (company_uuid, 'foreman', 'inventory', true),
    (company_uuid, 'foreman', 'attention-reports', true),
    (company_uuid, 'foreman', 'daily-reports', true),
    (company_uuid, 'foreman', 'system-settings', false),
    
    -- Account - Financial focus
    (company_uuid, 'account', 'dashboard', true),
    (company_uuid, 'account', 'timesheets', true),
    (company_uuid, 'account', 'employees', false),
    (company_uuid, 'account', 'jobsite-management', false),
    (company_uuid, 'account', 'invoice-management', true),
    (company_uuid, 'account', 'quotes', true),
    (company_uuid, 'account', 'bills-expenses', true),
    (company_uuid, 'account', 'material-requests', false),
    (company_uuid, 'account', 'inventory', false),
    (company_uuid, 'account', 'attention-reports', false),
    (company_uuid, 'account', 'daily-reports', false),
    (company_uuid, 'account', 'system-settings', false),
    
    -- Employee - Basic access
    (company_uuid, 'employee', 'dashboard', true),
    (company_uuid, 'employee', 'timesheet', true),
    (company_uuid, 'employee', 'missed-punch-requests', true),
    (company_uuid, 'employee', 'attention-report', true),
    (company_uuid, 'employee', 'settings', true)
  ON CONFLICT (company_id, role, menu_item_id) DO NOTHING;
END;
$$;

-- Update the handle_new_company trigger function to seed permissions
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_rule_content TEXT;
BEGIN
  -- Fetch the latest default rule content
  SELECT content INTO default_rule_content
  FROM public.default_rules
  ORDER BY created_at DESC
  LIMIT 1;

  -- Insert new company_settings record with default rules
  INSERT INTO public.company_settings (
    company_id,
    company_name,
    company_rules_text
  ) VALUES (
    NEW.id,
    NEW.name,
    default_rule_content
  );

  -- Seed default role permissions for the new company
  PERFORM public.seed_default_role_permissions(NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block company creation
    RAISE WARNING 'Failed to create company_settings or seed permissions for company %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_reports_updated_at();