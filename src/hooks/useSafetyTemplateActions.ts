
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSafetyTemplateActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadTemplate = useMutation({
    mutationFn: async ({ template_name, description, file }: {
      template_name: string;
      description: string;
      file: File;
    }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('📤 Uploading safety template:', template_name);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${template_name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const filePath = `${user.companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('safety-templates')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Error uploading file:', uploadError);
        throw uploadError;
      }

      // Insert template record
      const { data, error } = await supabase
        .from('safety_templates')
        .insert({
          company_id: user.companyId,
          template_name,
          description,
          file_url: filePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating template record:', error);
        throw error;
      }

      console.log('✅ Safety template uploaded successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-templates'] });
      toast({
        title: 'Success',
        description: 'Safety template uploaded successfully',
      });
    },
    onError: (error) => {
      console.error('💥 Upload template error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('🗑️ Deleting safety template:', templateId);

      // Get template details first
      const { data: template, error: fetchError } = await supabase
        .from('safety_templates')
        .select('file_url')
        .eq('id', templateId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching template:', fetchError);
        throw fetchError;
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('safety-templates')
        .remove([template.file_url]);

      if (storageError) {
        console.error('❌ Error deleting file from storage:', storageError);
        throw storageError;
      }

      // Delete template record
      const { error } = await supabase
        .from('safety_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('❌ Error deleting template record:', error);
        throw error;
      }

      console.log('✅ Safety template deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-templates'] });
      toast({
        title: 'Success',
        description: 'Safety template deleted successfully',
      });
    },
    onError: (error) => {
      console.error('💥 Delete template error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const downloadTemplate = useMutation({
    mutationFn: async (filePath: string) => {
      console.log('📥 Downloading safety template:', filePath);

      const { data, error } = await supabase.storage
        .from('safety-templates')
        .download(filePath);

      if (error) {
        console.error('❌ Error downloading file:', error);
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || 'template.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Safety template downloaded successfully');
    },
    onError: (error) => {
      console.error('💥 Download template error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    uploadTemplate,
    deleteTemplate,
    downloadTemplate,
  };
};
