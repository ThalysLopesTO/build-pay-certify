-- Create reminder_logs table for tracking sent reminders
CREATE TABLE public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  record_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for reminder_logs
CREATE POLICY "Companies can view their own reminder logs" 
ON public.reminder_logs 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "System can insert reminder logs" 
ON public.reminder_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_reminder_logs_company_id ON public.reminder_logs(company_id);
CREATE INDEX idx_reminder_logs_type_record ON public.reminder_logs(type, record_id);
CREATE INDEX idx_reminder_logs_sent_at ON public.reminder_logs(sent_at);

-- Add reminder settings to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN enable_invoice_reminders BOOLEAN DEFAULT true,
ADD COLUMN invoice_reminder_days_before INTEGER DEFAULT 3,
ADD COLUMN invoice_overdue_reminder_days INTEGER DEFAULT 7,
ADD COLUMN enable_quote_reminders BOOLEAN DEFAULT true,
ADD COLUMN quote_reminder_days INTEGER DEFAULT 14;