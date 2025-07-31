import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  company_id: string;
  template_type: 'invoice' | 'quote' | 'invite' | 'welcome' | 'reminder';
  subject: string;
  body_html: string;
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

export const useEmailTemplate = (templateType: string) => {
  const { data: template, isLoading } = useQuery({
    queryKey: ['email-template', templateType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
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

// Default templates
export const getDefaultTemplate = (type: string): { subject: string; body_html: string } => {
  const templates = {
    quote: {
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
          
          <p>{{custom_message}}</p>
          
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
    invoice: {
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
          
          <p>{{custom_message}}</p>
          
          <p>If you have any questions, feel free to reply to this email.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>Best regards,<br>
            <strong>{{company_name}}</strong><br>
            {{company_address}}<br>
            {{hst_number}} (HST: {{hst_number}})</p>
          </div>
        </div>
      `
    }
  };

  return templates[type as keyof typeof templates] || templates.quote;
};

// Helper function to replace placeholders
export const replacePlaceholders = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
};