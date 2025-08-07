import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'react-hot-toast';

interface MaterialRequestAttachment {
  id: string;
  material_request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export const useMaterialRequestAttachments = (materialRequestId?: string) => {
  return useQuery({
    queryKey: ['material-request-attachments', materialRequestId],
    queryFn: async () => {
      if (!materialRequestId) return [];
      
      const { data, error } = await supabase
        .from('material_request_attachments')
        .select('*')
        .eq('material_request_id', materialRequestId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as MaterialRequestAttachment[];
    },
    enabled: !!materialRequestId,
  });
};

export const useUploadMaterialRequestAttachments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      files, 
      materialRequestId 
    }: { 
      files: File[]; 
      materialRequestId: string;
    }) => {
      if (!user?.companyId) {
        throw new Error('User company not found');
      }

      const uploadedFiles: MaterialRequestAttachment[] = [];

      for (const file of files) {
        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.companyId}/${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('material-request-attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Save file info to database
        const { data: attachmentData, error: dbError } = await supabase
          .from('material_request_attachments')
          .insert({
            material_request_id: materialRequestId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from('material-request-attachments')
            .remove([filePath]);
          throw new Error(`Failed to save file info for ${file.name}: ${dbError.message}`);
        }

        uploadedFiles.push(attachmentData);
      }

      return uploadedFiles;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['material-request-attachments', variables.materialRequestId] 
      });
      toast.success(`${data.length} file(s) uploaded successfully!`);
    },
    onError: (error: any) => {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Failed to upload files');
    },
  });
};

export const useDeleteMaterialRequestAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      attachmentId, 
      filePath 
    }: { 
      attachmentId: string; 
      filePath: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('material-request-attachments')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('material_request_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        throw new Error(`Failed to delete attachment: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-request-attachments'] });
      toast.success('File deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file');
    },
  });
};

export const getMaterialRequestAttachmentUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('material-request-attachments')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};