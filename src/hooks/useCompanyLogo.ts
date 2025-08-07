
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

      // Upload file to Supabase Storage with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${user.companyId}/logo-${timestamp}.${fileExt}`;
      
      // First, try to remove any existing logo files to avoid accumulating files
      try {
        const { data: existingFiles } = await supabase.storage
          .from('company-logos')
          .list(user.companyId);
        
        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles.map(file => `${user.companyId}/${file.name}`);
          await supabase.storage
            .from('company-logos')
            .remove(filesToRemove);
        }
      } catch (error) {
        console.warn('Could not clean up old logo files:', error);
        // Continue with upload even if cleanup fails
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: false, // Don't upsert since we're using unique filenames
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL with cache-busting parameter
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const cacheBustedUrl = `${urlData.publicUrl}?v=${timestamp}`;

      // Update company record with logo URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: cacheBustedUrl })
        .eq('id', user.companyId);

      if (updateError) {
        throw updateError;
      }

      return cacheBustedUrl;
    },
    onSuccess: (logoUrl) => {
      // Force refresh by invalidating queries and updating cache
      queryClient.invalidateQueries({ queryKey: ['company-logo', user?.companyId] });
      queryClient.setQueryData(['company-logo', user?.companyId], logoUrl);
      
      // Force a page refresh of cached images
      setTimeout(() => {
        const images = document.querySelectorAll('img[alt="Company Logo"]');
        images.forEach((img: any) => {
          const src = img.src;
          img.src = '';
          img.src = src;
        });
      }, 100);
      
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
