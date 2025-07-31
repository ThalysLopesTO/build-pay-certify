-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('invoice', 'quote', 'invite', 'welcome', 'reminder')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can manage their email templates"
ON public.email_templates
FOR ALL
USING (
  company_id = get_user_company_id() AND 
  is_company_admin()
);

CREATE POLICY "Users can view their company email templates"
ON public.email_templates
FOR SELECT
USING (company_id = get_user_company_id());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_templates_updated_at();