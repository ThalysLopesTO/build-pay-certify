import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  company_id: string;
  template_type: 'invoice' | 'quote' | 'invite' | 'welcome' | 'reminder';
  subject: string;
  body_html: string;
  reminder_stage?: 'general' | 'before_due' | 'overdue' | 'follow_up';
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  return { templates, isLoading, error };
};

export const useEmailTemplate = (templateType: string, reminderStage: string = 'general') => {
  const { data: template, isLoading } = useQuery({
    queryKey: ['email-template', templateType, reminderStage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('reminder_stage', reminderStage)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as EmailTemplate | null;
    },
  });

  return { template, isLoading };
};

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
      const user = await supabase.auth.getUser();
      const userProfile = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', user.data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          ...templateData,
          company_id: userProfile.data?.company_id!
        }])
        .select()
        .single();

      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Default templates with stage-specific content
export const getDefaultTemplate = (type: string, stage: string = 'general'): { subject: string; body_html: string } => {
  const templates = {
    quote: {
      general: {
        subject: 'Quote {{quote_number}} from {{company_name}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Quote {{quote_number}}</h2>
            <p>Hi {{client_name}},</p>
            
            <p>Please find your quote details below:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Quote Number:</strong> {{quote_number}}</p>
              <p><strong>Project:</strong> {{project_name}}</p>
              <p><strong>Total Amount:</strong> ${"{{total_amount}}"}}</p>
              <p><strong>Valid Until:</strong> {{expiry_date}}</p>
            </div>
            
            <p>If you have any questions, feel free to reply to this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,<br>
              <strong>{{company_name}}</strong><br>
              {{company_address}}<br>
              {{company_phone}}</p>
            </div>
          </div>
        `
      },
      follow_up: {
        subject: 'Following up on Quote {{quote_number}} - {{company_name}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Following up on Quote {{quote_number}}</h2>
            <p>Hi {{client_name}},</p>
            
            <p>I wanted to follow up on the quote we sent you recently. Have you had a chance to review it?</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Quote Number:</strong> {{quote_number}}</p>
              <p><strong>Project:</strong> {{project_name}}</p>
              <p><strong>Total Amount:</strong> ${"{{total_amount}}"}}</p>
              <p><strong>Valid Until:</strong> {{expiry_date}}</p>
            </div>
            
            <p>If you have any questions or need clarification on any aspects of the quote, please don't hesitate to reach out.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,<br>
              <strong>{{company_name}}</strong><br>
              {{company_address}}<br>
              {{company_phone}}</p>
            </div>
          </div>
        `
      }
    },
    invoice: {
      general: {
        subject: 'Invoice {{invoice_number}} from {{company_name}}',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Invoice {{invoice_number}}</h2>
            <p>Hi {{client_name}},</p>
            
            <p>Please find your invoice details below:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
              <p><strong>Project:</strong> {{project_name}}</p>
              <p><strong>Amount Due:</strong> ${"{{total_amount}}"}}</p>
              <p><strong>Due Date:</strong> {{due_date}}</p>
            </div>
            
            <p>If you have any questions, feel free to reply to this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,<br>
              <strong>{{company_name}}</strong><br>
              {{company_address}}<br>
              {{hst_number}}</p>
            </div>
          </div>
        `
      },
      before_due: {
        subject: 'Friendly Reminder: Invoice {{invoice_number}} Due Soon',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Payment Reminder</h2>
            <p>Hi {{client_name}},</p>
            
            <p>This is a friendly reminder that Invoice {{invoice_number}} is due soon.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
              <p><strong>Project:</strong> {{project_name}}</p>
              <p><strong>Amount Due:</strong> ${"{{total_amount}}"}}</p>
              <p><strong>Due Date:</strong> {{due_date}}</p>
            </div>
            
            <p>Please ensure payment is made by the due date to avoid any late fees. If you have already made payment, please disregard this notice.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,<br>
              <strong>{{company_name}}</strong><br>
              {{company_address}}<br>
              {{hst_number}}</p>
            </div>
          </div>
        `
      },
      overdue: {
        subject: 'URGENT: Overdue Invoice {{invoice_number}} - Payment Required',
        body_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">Overdue Invoice Notice</h2>
            <p>Hi {{client_name}},</p>
            
            <p><strong>This invoice is now overdue and requires immediate attention.</strong></p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
              <p><strong>Project:</strong> {{project_name}}</p>
              <p><strong>Amount Due:</strong> ${"{{total_amount}}"}}</p>
              <p><strong>Original Due Date:</strong> {{due_date}}</p>
              <p style="color: #dc3545;"><strong>Status: OVERDUE</strong></p>
            </div>
            
            <p>Please remit payment immediately to avoid additional fees and potential collection activities. If there are any issues with this invoice, contact us right away.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,<br>
              <strong>{{company_name}}</strong><br>
              {{company_address}}<br>
              {{hst_number}}</p>
            </div>
          </div>
        `
      }
    }
  };

  const typeTemplates = templates[type as keyof typeof templates];
  if (!typeTemplates) return templates.quote.general;
  
  const stageTemplate = typeTemplates[stage as keyof typeof typeTemplates];
  return stageTemplate || typeTemplates.general || templates.quote.general;
};

// Helper function to replace placeholders
export const replacePlaceholders = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
};