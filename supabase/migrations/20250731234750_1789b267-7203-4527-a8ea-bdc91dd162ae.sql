-- Add reminder_stage column to email_templates
ALTER TABLE public.email_templates 
ADD COLUMN reminder_stage text DEFAULT 'general';

-- Create unique index for company_id, template_type, and reminder_stage
CREATE UNIQUE INDEX idx_email_templates_unique_stage 
ON public.email_templates (company_id, template_type, reminder_stage);

-- Update the trigger to handle updated_at
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_templates_updated_at();