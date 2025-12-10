import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InventoryPhoto {
  id: string;
  inventory_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET_NAME = 'equipment-photos';

export const getInventoryPhotoUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};

export const useInventoryPhotos = (inventoryId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ['inventory-photos', inventoryId],
    queryFn: async () => {
      if (!inventoryId) return [];

      const { data, error } = await supabase
        .from('inventory_photos')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inventory photos:', error);
        throw error;
      }

      return data as InventoryPhoto[];
    },
    enabled: !!inventoryId,
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ inventoryId, files }: { inventoryId: string; files: File[] }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const uploadedPhotos: InventoryPhoto[] = [];

      for (const file of files) {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${inventoryId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Create database record
        const { data: photoRecord, error: dbError } = await supabase
          .from('inventory_photos')
          .insert({
            inventory_id: inventoryId,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error creating photo record:', dbError);
          // Try to clean up the uploaded file
          await supabase.storage.from(BUCKET_NAME).remove([fileName]);
          throw dbError;
        }

        uploadedPhotos.push(photoRecord as InventoryPhoto);
      }

      return uploadedPhotos;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-photos', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-photo-counts'] });
      toast({
        title: 'Success',
        description: 'Photos uploaded successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to upload photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: InventoryPhoto) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([photo.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete database record even if storage deletion fails
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) {
        console.error('Error deleting photo record:', dbError);
        throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-photos', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-photo-counts'] });
      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to delete photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    },
  });

  return {
    photos: photosQuery.data || [],
    isLoading: photosQuery.isLoading,
    error: photosQuery.error,
    uploadPhotos: uploadPhotosMutation.mutateAsync,
    deletePhoto: deletePhotoMutation.mutateAsync,
    isUploading: uploadPhotosMutation.isPending,
    isDeleting: deletePhotoMutation.isPending,
  };
};

// Hook to get photo counts for multiple inventory items
export const useInventoryPhotoCounts = (inventoryIds: string[]) => {
  return useQuery({
    queryKey: ['inventory-photo-counts', inventoryIds],
    queryFn: async () => {
      if (inventoryIds.length === 0) return {};

      const { data, error } = await supabase
        .from('inventory_photos')
        .select('inventory_id')
        .in('inventory_id', inventoryIds);

      if (error) {
        console.error('Error fetching photo counts:', error);
        throw error;
      }

      // Count photos per inventory item
      const counts: Record<string, number> = {};
      data.forEach((photo) => {
        counts[photo.inventory_id] = (counts[photo.inventory_id] || 0) + 1;
      });

      return counts;
    },
    enabled: inventoryIds.length > 0,
  });
};
