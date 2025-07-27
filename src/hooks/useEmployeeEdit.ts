import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface UpdateEmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  trade: string;
  role: string;
  hourly_rate: number;
  worker_type: string;
  photo_url?: string | null;
}

export const useEmployeeEdit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      updateData, 
      newPhoto 
    }: { 
      employeeId: string; 
      updateData: Omit<UpdateEmployeeData, 'id'>; 
      newPhoto?: File;
    }) => {
      let photoUrl = updateData.photo_url;

      // Upload new photo if provided
      if (newPhoto) {
        console.log('Uploading updated employee photo...');
        const fileExtension = newPhoto.name.split('.').pop();
        const fileName = `${employeeId}.${fileExtension}`;
        
        // Delete old photo if exists
        if (updateData.photo_url) {
          const oldFileName = updateData.photo_url.split('/').pop();
          if (oldFileName && oldFileName !== fileName) {
            await supabase.storage
              .from('employee-photos')
              .remove([oldFileName]);
          }
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, newPhoto, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error('Failed to upload employee photo');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
        console.log('Photo uploaded successfully:', photoUrl);
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          position: updateData.position,
          trade: updateData.trade,
          role: updateData.role,
          hourly_rate: updateData.hourly_rate,
          worker_type: updateData.worker_type,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;

      return { ...data, photo_url: photoUrl };
    },
    onMutate: async ({ employeeId, updateData, newPhoto }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['employee-directory', user?.companyId] });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData(['employee-directory', user?.companyId]);

      // Optimistically update the cache
      queryClient.setQueryData(['employee-directory', user?.companyId], (old: any[]) => {
        if (!old) return old;
        
        return old.map(employee => {
          if (employee.id === employeeId) {
            return {
              ...employee,
              ...updateData,
              // If uploading a new photo, we'll update the URL when the mutation succeeds
              ...(newPhoto ? {} : { photo_url: updateData.photo_url }),
            };
          }
          return employee;
        });
      });

      // Return a context object with the snapshotted value
      return { previousEmployees };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employee-directory', user?.companyId], context.previousEmployees);
      }
      
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update employee",
        variant: "destructive",
      });
    },
    onSuccess: (updatedEmployee, { updateData }) => {
      // Update the cache with the final data from the server (including new photo URL if uploaded)
      queryClient.setQueryData(['employee-directory', user?.companyId], (old: any[]) => {
        if (!old) return old;
        
        return old.map(employee => {
          if (employee.id === updatedEmployee.id) {
            return updatedEmployee;
          }
          return employee;
        });
      });

      toast({
        title: "Employee Updated",
        description: `${updateData.first_name} ${updateData.last_name} has been updated successfully.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['employee-directory', user?.companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-enhanced', user?.companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-v2', user?.companyId] });
    },
  });
};