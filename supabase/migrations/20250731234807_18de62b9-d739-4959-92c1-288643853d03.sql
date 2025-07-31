-- Add reminder_stage column to email_templates
ALTER TABLE public.email_templates 
ADD COLUMN reminder_stage text DEFAULT 'general';

-- Create unique index for company_id, template_type, and reminder_stage
CREATE UNIQUE INDEX idx_email_templates_unique_stage 
ON public.email_templates (company_id, template_type, reminder_stage);