
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useCompanyLogo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch company logo URL
  const { data: logoUrl, isLoading } = useQuery({
    queryKey: ['company-logo', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', user.companyId)
        .single();

      if (error) {
        console.error('Error fetching company logo:', error);
        return null;
      }

      return data?.logo_url || null;
    },
    enabled: !!user?.companyId,
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.companyId}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update company record with logo URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', user.companyId);

      if (updateError) {
        throw updateError;
      }

      return urlData.publicUrl;
    },
    onSuccess: (logoUrl) => {
      queryClient.invalidateQueries({ queryKey: ['company-logo', user?.companyId] });
      toast({
        title: 'Logo Uploaded',
        description: 'Company logo has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload company logo. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Remove logo mutation
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      // Update company record to remove logo URL
      const { error } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', user.companyId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-logo', user?.companyId] });
      toast({
        title: 'Logo Removed',
        description: 'Company logo has been removed successfully.',
      });
    },
    onError: (error) => {
      console.error('Error removing logo:', error);
      toast({
        title: 'Remove Failed',
        description: 'Failed to remove company logo. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    logoUrl,
    isLoading,
    uploadLogo: uploadLogoMutation.mutate,
    isUploading: uploadLogoMutation.isPending,
    removeLogo: removeLogoMutation.mutate,
    isRemoving: removeLogoMutation.isPending,
  };
};
