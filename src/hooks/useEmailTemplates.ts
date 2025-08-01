import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDefaultPlainTextTemplate } from '@/utils/emailTemplate';

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

// Use the new plain text default templates
export const getDefaultTemplate = (type: string, stage: string = 'general'): { subject: string; body_html: string } => {
  return getDefaultPlainTextTemplate(type, stage);
};

// Helper function to replace placeholders
export const replacePlaceholders = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
};