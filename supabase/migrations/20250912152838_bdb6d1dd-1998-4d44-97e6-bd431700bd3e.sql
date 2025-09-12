-- Fix notifications type check constraint to include all used notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with all notification types used in the application
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'certificate',
  'jobsite', 
  'material_request',
  'attention_report',
  'bill_due_soon',
  'bill_overdue', 
  'invoice_due_soon',
  'invoice_overdue',
  'daily_report'
));